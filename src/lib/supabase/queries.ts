import type { SupabaseClient } from "@supabase/supabase-js";
import type { NpsResponse } from "@/lib/types";
import type { ProdutoRow } from "@/lib/parseProdutos";
import type { ChamadoRecord } from "@/lib/parseChamados";
import { dbRowToNpsResponse, npsResponseToDbRow, type NpsResponseRow } from "./mapper";

const PAGE_SIZE = 1000;
const UPSERT_BATCH_SIZE = 500;
const UPSERT_CONCURRENCY = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
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
      await worker(batch);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, runWorker));
}

const RESPONSES_SELECT =
  "source_id, chamado, contact_name, contact_phone, equipment_raw, equipment_category, segmento, sku, marca, equipamento_oficial, barebone, cliente_uf, cliente_nome, projeto, segmento_consolidado, problema_solucionado, score, score_status, score_raw, classification, motivo_nota, satisfacao_atp, avaliacao_produto, comentario, data_chamado, data_chamado_raw, created_at_source";

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

export interface ChamadoInfo {
  chamado: string;
  segmento?: string;
  sku?: string;
  marca?: string;
  equipamentoOficial?: string;
  barebone?: string;
}

export async function upsertChamadoSegmento(
  supabase: SupabaseClient,
  pairs: ChamadoInfo[],
  importBatchId: string | null,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const rows = pairs.map((p) => ({
    chamado: p.chamado,
    segmento: p.segmento,
    sku: p.sku,
    marca: p.marca,
    equipamento_oficial: p.equipamentoOficial,
    barebone: p.barebone,
    import_batch_id: importBatchId,
  }));
  const batches = chunk(rows, UPSERT_BATCH_SIZE);
  let done = 0;

  await runBatchesConcurrent(batches, UPSERT_CONCURRENCY, async (batch) => {
    const { error } = await supabase.from("nps_chamado_segmento").upsert(batch, { onConflict: "chamado" });
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
