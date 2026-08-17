import type { SupabaseClient } from "@supabase/supabase-js";
import type { NpsResponse } from "@/lib/types";
import type { ProdutoRow } from "@/lib/parseProdutos";
import type { ChamadoRecord } from "@/lib/parseChamados";
import { dbRowToNpsResponse, npsResponseToDbRow, type NpsResponseRow } from "./mapper";

const PAGE_SIZE = 1000;
// Kept modest on purpose: Supabase enforces an 8s statement_timeout for the
// authenticated role (project-wide, protects against runaway queries — not
// something we should raise). Wide/heavily-indexed tables like nps_chamados
// (63 columns, 6 indexes) can blow past that under concurrent load with
// bigger batches, so batch size and concurrency both stay conservative.
const UPSERT_BATCH_SIZE = 200;
const UPSERT_CONCURRENCY = 4;
const RETRY_ATTEMPTS = 3;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "57014") return true;
  return typeof e.message === "string" && e.message.toLowerCase().includes("timeout");
}

/** Retries only on statement-timeout errors — upserts are idempotent, so a retry is safe. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isTimeoutError(e) || attempt === RETRY_ATTEMPTS) throw e;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("unreachable");
}

/** Runs `worker` over `batches` with at most `concurrency` in flight at once. */
async function runBatchesConcurrent<T>(
  batches: T[][],
  concurrency: number,
  worker: (batch: T[]) => Promise<void>
): Promise<void> {
  let next = 0;
  async function runWorker() {
    while (next < batches.length) {
      const batch = batches[next++];
      await withRetry(() => worker(batch));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, runWorker));
}

const RESPONSES_SELECT =
  "source_id, chamado, contact_name, contact_phone, equipment_raw, equipment_category, segmento, sku, marca, equipamento_oficial, barebone, cliente_uf, cliente_nome, projeto, ct, ft, encerramento, encerramento_desc, tipo, serie, descricao_material, modal_de_envio, data_entrega_retorno, utiliza_peca, segmento_consolidado, problema_solucionado, score, score_status, score_raw, classification, motivo_nota, satisfacao_atp, avaliacao_produto, comentario, data_chamado, data_chamado_raw, created_at_source";

export async function fetchAllResponses(
  supabase: SupabaseClient,
  onProgress?: (done: number, total: number) => void
): Promise<NpsResponse[]> {
  const { count, error: countError } = await supabase
    .from("nps_responses")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  const total = count ?? 0;
  if (total === 0) return [];

  const pageCount = Math.ceil(total / PAGE_SIZE);
  let done = 0;
  onProgress?.(0, total);

  const pages = await Promise.all(
    Array.from({ length: pageCount }, async (_, i) => {
      const from = i * PAGE_SIZE;
      const { data, error } = await supabase
        .from("nps_responses")
        .select(RESPONSES_SELECT)
        .range(from, from + PAGE_SIZE - 1)
        .order("source_id", { ascending: true });

      if (error) throw error;
      done += data?.length ?? 0;
      onProgress?.(done, total);
      return (data as NpsResponseRow[] | null) ?? [];
    })
  );

  return pages.flat().map(dbRowToNpsResponse);
}

export interface ImportSummary {
  fileName: string;
  totalRows: number;
  validScores: number;
  noResponse: number;
  invalidScores: number;
}

export async function createImportBatch(
  supabase: SupabaseClient,
  summary: ImportSummary,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("nps_imports")
    .insert({
      file_name: summary.fileName,
      imported_by: userId,
      total_rows: summary.totalRows,
      valid_scores: summary.validScores,
      no_response: summary.noResponse,
      invalid_scores: summary.invalidScores,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function upsertResponses(
  supabase: SupabaseClient,
  responses: NpsResponse[],
  importBatchId: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const rows = responses.map((r) => npsResponseToDbRow(r, importBatchId));
  const batches = chunk(rows, UPSERT_BATCH_SIZE);
  let done = 0;

  await runBatchesConcurrent(batches, UPSERT_CONCURRENCY, async (batch) => {
    const { error } = await supabase.from("nps_responses").upsert(batch, { onConflict: "source_id" });
    if (error) throw error;
    done += batch.length;
    onProgress?.(done, rows.length);
  });
}

export async function syncSegmento(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.rpc("sync_nps_segmento");
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Recalcula Num_Ocorrência (recorrência por número de série) em nps_chamados e propaga em nps_responses via syncSegmento. */
export interface ChamadosEnviadosParams {
  segmentos: string[];
  marcas?: string[];
  tiposProduto?: string[];
  modelos?: string[];
  chamado?: string;
  dateFrom: string | null;
  dateTo: string | null;
}

/**
 * Universo de "pesquisas enviadas" (Power BI MEDIDAS.QTD_Chamados_Enviados): contatos
 * distintos elegíveis em Chamados_Recente, escopados por FT (Varejo/CORP Plataforma) ou
 * Encerramento+GARANTIA (GOV/CORP/HASS) — não é a contagem de linhas de nps_responses.
 */
export async function fetchChamadosEnviadosCount(
  supabase: SupabaseClient,
  params: ChamadosEnviadosParams
): Promise<number> {
  if (!params.dateFrom || !params.dateTo || params.segmentos.length === 0) return 0;

  const { data, error } = await supabase.rpc("chamados_enviados_count", {
    p_segmentos: params.segmentos,
    p_marcas: params.marcas?.length ? params.marcas : null,
    p_tipos_produto: params.tiposProduto?.length ? params.tiposProduto : null,
    p_modelos: params.modelos?.length ? params.modelos : null,
    p_chamado: params.chamado || null,
    p_date_from: params.dateFrom,
    p_date_to: params.dateTo,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function syncRecorrencia(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.rpc("sync_nps_recorrencia");
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function upsertChamados(
  supabase: SupabaseClient,
  records: ChamadoRecord[],
  importBatchId: string | null,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const rows = records.map((r) => ({ ...r, import_batch_id: importBatchId }));
  const batches = chunk(rows, UPSERT_BATCH_SIZE);
  let done = 0;

  await runBatchesConcurrent(batches, UPSERT_CONCURRENCY, async (batch) => {
    const { error } = await supabase.from("nps_chamados").upsert(batch, { onConflict: "chamado" });
    if (error) throw error;
    done += batch.length;
    onProgress?.(done, rows.length);
  });
}

export async function upsertProdutos(
  supabase: SupabaseClient,
  produtos: ProdutoRow[],
  importBatchId: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const rows = produtos.map((p) => ({ ...p, import_batch_id: importBatchId }));
  const batches = chunk(rows, UPSERT_BATCH_SIZE);
  let done = 0;

  await runBatchesConcurrent(batches, UPSERT_CONCURRENCY, async (batch) => {
    const { error } = await supabase.from("nps_produtos").upsert(batch, { onConflict: "codigo_material" });
    if (error) throw error;
    done += batch.length;
    onProgress?.(done, rows.length);
  });
}

export async function fetchProdutoStats(supabase: SupabaseClient): Promise<{
  total: number;
  byEquipamento: { equipamento: string; total: number }[];
  byFabricante: { fabricante: string; total: number }[];
}> {
  const { count, error: countError } = await supabase
    .from("nps_produtos")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  const { data, error } = await supabase.from("nps_produtos").select("equipamento, fabricante");
  if (error) throw error;

  const equipCounts = new Map<string, number>();
  const fabCounts = new Map<string, number>();
  for (const row of data as { equipamento: string | null; fabricante: string | null }[]) {
    const eq = row.equipamento ?? "Não informado";
    const fab = row.fabricante ?? "Não informado";
    equipCounts.set(eq, (equipCounts.get(eq) ?? 0) + 1);
    fabCounts.set(fab, (fabCounts.get(fab) ?? 0) + 1);
  }

  return {
    total: count ?? 0,
    byEquipamento: [...equipCounts.entries()]
      .map(([equipamento, total]) => ({ equipamento, total }))
      .sort((a, b) => b.total - a.total),
    byFabricante: [...fabCounts.entries()]
      .map(([fabricante, total]) => ({ fabricante, total }))
      .sort((a, b) => b.total - a.total),
  };
}
