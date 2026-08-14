import Papa from "papaparse";
import { normalizeKey } from "./text";

const CHAMADO_COLUMN_NAMES = [
  "ct", "atp", "abertura", "ft", "encerramento", "segmento", "tipo",
  "texto_abertura", "texto_breve", "encerramento_desc", "texto_encerrado",
  "projeto", "cliente_codigo", "cliente_nome", "escritorio_vendas",
  "cliente_uf", "cliente_cidade", "detentor_nome", "detentor_cep",
  "detentor_uf", "detentor_cidade", "detentor_bairro", "detentor_logradouro",
  "serie", "sku", "marca", "equipamento", "barebone", "utiliza_peca",
  "utiliza_peca_engenharia", "hass", "sintoma", "ocorrencia_chamado",
  "tempo_falha_meses", "tecnico_nome", "grupo_economico", "os_cliente",
  "idade_parque", "idade_parque_falha", "assistencia_uf", "assistencia_cidade",
  "descricao_material", "sla_data_limite", "sla_tipo_calculo", "sla_status",
  "usuario_abertura", "sintoma_eng", "divisao_eng", "varejo", "login",
  "modal", "status_chamado", "data_entrega_retorno", "status_retorno",
  "data_retirada_entrega_cliente", "detentor_email", "detentor_celular",
  "detentor_contato", "prioritario", "modal_de_envio", "peca_eng_2",
  "data_inicio_garantia",
] as const;

export type ChamadoRecord = Record<(typeof CHAMADO_COLUMN_NAMES)[number] | "chamado", string | undefined>;

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
