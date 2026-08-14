import Papa from "papaparse";
import { normalizeKey } from "./text";

export interface ProdutoRow {
  codigo_material: string;
  barebone: string | null;
  equipamento: string | null;
  tipo_equipamento: string | null;
  marca: string | null;
  comercial: string | null;
  processador: string | null;
  fabricante: string | null;
  projeto: string | null;
  cliente: string | null;
  os: string | null;
  tempo_reparo: string | null;
  classificacao_pagamento: string | null;
  bios: string | null;
}

const COLUMN_MAP: Record<keyof Omit<ProdutoRow, "codigo_material">, string[]> = {
  barebone: ["barebone"],
  equipamento: ["equipamento"],
  tipo_equipamento: ["tipo_equipamento", "tipo equipamento"],
  marca: ["marca"],
  comercial: ["comercial"],
  processador: ["processador"],
  fabricante: ["fabricante"],
  projeto: ["projeto"],
  cliente: ["cliente"],
  os: ["os"],
  tempo_reparo: ["tempo_reparo", "tempo reparo"],
  classificacao_pagamento: ["classificacao_pagamento", "classificacao pagamento"],
  bios: ["bios"],
};

const CODIGO_HINTS = ["codigo_material", "codigo material", "cod_material", "sku"];

function findColumn(fields: string[], hints: string[]): string | null {
  for (const field of fields) {
    const key = normalizeKey(field);
    if (hints.some((hint) => key === hint)) return field;
  }
  return null;
}

export interface ParseProdutosResult {
  produtos: ProdutoRow[];
  totalRows: number;
  codigoColumn: string | null;
}

export function parseProdutosCsv(fileText: string): ParseProdutosResult {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  const codigoColumn = findColumn(fields, CODIGO_HINTS);

  const columnByKey = Object.fromEntries(
    (Object.keys(COLUMN_MAP) as Array<keyof typeof COLUMN_MAP>).map((key) => [
      key,
      findColumn(fields, COLUMN_MAP[key]),
    ])
  ) as Record<keyof Omit<ProdutoRow, "codigo_material">, string | null>;

  const produtos: ProdutoRow[] = [];

  if (codigoColumn) {
    const seen = new Set<string>();
    for (const row of parsed.data) {
      const codigo = (row[codigoColumn] ?? "").trim();
      if (!codigo || seen.has(codigo)) continue;
      seen.add(codigo);

      const produto: ProdutoRow = { codigo_material: codigo } as ProdutoRow;
      for (const key of Object.keys(columnByKey) as Array<keyof typeof columnByKey>) {
        const col = columnByKey[key];
        produto[key] = col ? (row[col] ?? "").trim() || null : null;
      }
      produtos.push(produto);
    }
  }

  return { produtos, totalRows: parsed.data.length, codigoColumn };
}
