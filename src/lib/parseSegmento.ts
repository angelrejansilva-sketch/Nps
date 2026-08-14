import Papa from "papaparse";
import { normalizeKey } from "./text";
import type { ChamadoInfo } from "./supabase/queries";

const CHAMADO_HEADER_HINTS = ["chamado"];
const SEGMENTO_HEADER_HINTS = ["segmento"];
const SKU_HEADER_HINTS = ["sku"];
const MARCA_HEADER_HINTS = ["marca"];
const EQUIPAMENTO_HEADER_HINTS = ["equipamento"];
const BAREBONE_HEADER_HINTS = ["barebone"];

function findColumn(fields: string[], hints: string[]): string | null {
  for (const field of fields) {
    const key = normalizeKey(field);
    if (hints.some((hint) => key === hint || key.startsWith(hint))) return field;
  }
  return null;
}

export interface ParseSegmentoResult {
  pairs: ChamadoInfo[];
  totalRows: number;
  chamadoColumn: string | null;
  segmentoColumn: string | null;
  skuColumn: string | null;
  marcaColumn: string | null;
  equipamentoColumn: string | null;
  bareboneColumn: string | null;
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
  const skuColumn = findColumn(fields, SKU_HEADER_HINTS);
  const marcaColumn = findColumn(fields, MARCA_HEADER_HINTS);
  const equipamentoColumn = findColumn(fields, EQUIPAMENTO_HEADER_HINTS);
  const bareboneColumn = findColumn(fields, BAREBONE_HEADER_HINTS);

  const pairs: ChamadoInfo[] = [];

  if (chamadoColumn) {
    const seen = new Set<string>();
    for (const row of parsed.data) {
      const chamado = (row[chamadoColumn] ?? "").trim();
      if (!chamado || seen.has(chamado)) continue;

      const segmento = segmentoColumn ? (row[segmentoColumn] ?? "").trim().toUpperCase() : "";
      const sku = skuColumn ? (row[skuColumn] ?? "").trim() : "";
      const marca = marcaColumn ? (row[marcaColumn] ?? "").trim().toUpperCase() : "";
      const equipamento = equipamentoColumn ? (row[equipamentoColumn] ?? "").trim().toUpperCase() : "";
      const barebone = bareboneColumn ? (row[bareboneColumn] ?? "").trim().toUpperCase() : "";

      if (!segmento && !sku && !marca && !equipamento && !barebone) continue;

      seen.add(chamado);
      pairs.push({
        chamado,
        segmento: segmento || undefined,
        sku: sku || undefined,
        marca: marca || undefined,
        equipamentoOficial: equipamento || undefined,
        barebone: barebone || undefined,
      });
    }
  }

  return {
    pairs,
    totalRows: parsed.data.length,
    chamadoColumn,
    segmentoColumn,
    skuColumn,
    marcaColumn,
    equipamentoColumn,
    bareboneColumn,
  };
}
