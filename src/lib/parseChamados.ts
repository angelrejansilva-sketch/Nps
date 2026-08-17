import Papa from "papaparse";
import { normalizeKey } from "./text";

// Mantém só as colunas que o app realmente lê (telas, sincronização de nps_responses,
// ou as views/funções SQL de elegibilidade) — o resto (textos livres de abertura/
// encerramento, campos de engenharia, endereço do detentor etc.) foi descartado do
// banco pra caber na cota gratuita do Supabase (texto_abertura+texto_encerrado sozinhos
// eram 153MB de ~440MB da tabela). Vem no CSV mas não é mais persistido.
const CHAMADO_COLUMN_NAMES = [
  "ct", "ft", "encerramento", "segmento", "tipo", "encerramento_desc",
  "projeto", "cliente_nome", "cliente_uf", "detentor_nome",
  "serie", "sku", "marca", "equipamento", "barebone", "utiliza_peca",
  "hass", "descricao_material", "sla_status", "varejo",
  "data_entrega_retorno", "detentor_celular", "prioritario", "modal_de_envio",
] as const;

export type ChamadoRecord = { chamado: string } & Record<(typeof CHAMADO_COLUMN_NAMES)[number], string | undefined>;

export interface ParseChamadosResult {
  records: ChamadoRecord[];
  totalRows: number;
  chamadoColumn: string | null;
  matchedColumns: string[];
}

export function parseChamadosCsv(fileText: string): ParseChamadosResult {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  const chamadoColumn = fields.find((f) => normalizeKey(f) === "chamado") ?? null;

  const columnByField = new Map<(typeof CHAMADO_COLUMN_NAMES)[number], string>();
  for (const field of fields) {
    const key = normalizeKey(field);
    if ((CHAMADO_COLUMN_NAMES as readonly string[]).includes(key)) {
      columnByField.set(key as (typeof CHAMADO_COLUMN_NAMES)[number], field);
    }
  }

  const records: ChamadoRecord[] = [];

  if (chamadoColumn) {
    const seen = new Set<string>();
    for (const row of parsed.data) {
      const chamado = (row[chamadoColumn] ?? "").trim();
      if (!chamado || seen.has(chamado)) continue;
      seen.add(chamado);

      const record: ChamadoRecord = { chamado } as ChamadoRecord;
      for (const [key, field] of columnByField) {
        const value = (row[field] ?? "").trim();
        record[key] = value || undefined;
      }
      records.push(record);
    }
  }

  return {
    records,
    totalRows: parsed.data.length,
    chamadoColumn,
    matchedColumns: [...columnByField.values()],
  };
}
