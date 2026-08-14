import Papa from "papaparse";
import { normalizeKey } from "./text";
import type { ChamadoSegmento } from "./supabase/queries";

const CHAMADO_HEADER_HINTS = ["chamado"];
const SEGMENTO_HEADER_HINTS = ["segmento"];

function findColumn(fields: string[], hints: string[]): string | null {
  for (const field of fields) {
    const key = normalizeKey(field);
    if (hints.some((hint) => key === hint || key.startsWith(hint))) return field;
  }
  return null;
}

export interface ParseSegmentoResult {
  pairs: ChamadoSegmento[];
  totalRows: number;
  chamadoColumn: string | null;
  segmentoColumn: string | null;
}

export function parseChamadoSegmentoCsv(fileText: string): ParseSegmentoResult {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  const chamadoColumn = findColumn(fields, CHAMADO_HEADER_HINTS);
  const segmentoColumn = findColumn(fields, SEGMENTO_HEADER_HINTS);

  const pairs: ChamadoSegmento[] = [];

  if (chamadoColumn && segmentoColumn) {
    const seen = new Set<string>();
    for (const row of parsed.data) {
      const chamado = (row[chamadoColumn] ?? "").trim();
      const segmento = (row[segmentoColumn] ?? "").trim().toUpperCase();
      if (!chamado || !segmento || seen.has(chamado)) continue;
      seen.add(chamado);
      pairs.push({ chamado, segmento });
    }
  }

  return {
    pairs,
    totalRows: parsed.data.length,
    chamadoColumn,
    segmentoColumn,
  };
}
