import type { SupabaseClient } from "@supabase/supabase-js";
import type { NpsResponse } from "@/lib/types";
import { dbRowToNpsResponse, npsResponseToDbRow, type NpsResponseRow } from "./mapper";

const PAGE_SIZE = 1000;
const UPSERT_BATCH_SIZE = 500;

export async function fetchAllResponses(supabase: SupabaseClient): Promise<NpsResponse[]> {
  const all: NpsResponse[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("nps_responses")
      .select(
        "source_id, chamado, contact_name, contact_phone, equipment_raw, equipment_category, problema_solucionado, score, score_status, score_raw, classification, motivo_nota, satisfacao_atp, avaliacao_produto, comentario, data_chamado, data_chamado_raw, created_at_source"
      )
      .range(from, from + PAGE_SIZE - 1)
      .order("source_id", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data as NpsResponseRow[]) {
      all.push(dbRowToNpsResponse(row));
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
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

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from("nps_responses").upsert(batch, { onConflict: "source_id" });
    if (error) throw error;
    onProgress?.(Math.min(i + UPSERT_BATCH_SIZE, rows.length), rows.length);
  }
}
