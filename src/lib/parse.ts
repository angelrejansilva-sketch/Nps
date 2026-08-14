import Papa from "papaparse";
import { categorizeEquipment } from "./classify";
import {
  classify,
  cleanPhone,
  normalizeComment,
  normalizeMotivo,
  parseAvaliacaoProduto,
  parseFlexibleDate,
  parseProblemaSolucionado,
  parseSatisfacaoAtp,
  parseScore,
} from "./normalize";
import type { NpsResponse, ParseResult, QualityIssue } from "./types";

const EXPECTED_COLUMNS = [
  "id",
  "created_at",
  "contact_name",
  "contact_phone",
  "chamado",
  "tipo_equipamento",
  "problema_solucionado",
  "recomendar_servico",
  "motivo_nota",
  "satisfacao_atp",
  "avaliacao_produto",
  "coment_adicional",
  "data_do_chamado",
];

type RawRow = Record<string, string>;

function toRow(raw: RawRow, index: number): NpsResponse {
  const issues: QualityIssue[] = [];

  const scoreRaw = raw.recomendar_servico ?? "";
  const { score, status: scoreStatus, issue: scoreIssue } = parseScore(scoreRaw);
  if (scoreIssue) issues.push(scoreIssue);

  const dataChamadoRaw = raw.data_do_chamado ?? "";
  const dataChamado = parseFlexibleDate(dataChamadoRaw);
  if (dataChamadoRaw.trim() && !dataChamado) {
    issues.push({ field: "data_do_chamado", reason: "Data não reconhecida", raw: dataChamadoRaw });
  }

  const createdAtRaw = raw.created_at ?? "";
  const createdAt = parseFlexibleDate(createdAtRaw);

  const equipmentRaw = (raw.tipo_equipamento ?? "").trim();

  return {
    id: raw.id?.trim() || `row-${index}`,
    createdAt,
    contactName: (raw.contact_name ?? "").trim(),
    contactPhone: cleanPhone(raw.contact_phone ?? ""),
    chamado: (raw.chamado ?? "").trim(),
    equipmentRaw,
    equipmentCategory: categorizeEquipment(equipmentRaw),
    segmento: null,
    sku: null,
    marca: null,
    equipamentoOficial: null,
    barebone: null,
    problemaSolucionado: parseProblemaSolucionado(raw.problema_solucionado ?? ""),
    score,
    scoreStatus,
    scoreRaw,
    classification: classify(score),
    motivoNota: normalizeMotivo(raw.motivo_nota ?? ""),
    satisfacaoAtp: parseSatisfacaoAtp(raw.satisfacao_atp ?? ""),
    avaliacaoProduto: parseAvaliacaoProduto(raw.avaliacao_produto ?? ""),
    comentario: normalizeComment(raw.coment_adicional ?? ""),
    dataChamado,
    dataChamadoRaw,
    qualityIssues: issues,
  };
}

export function parseNpsCsv(fileText: string): ParseResult {
  const parsed = Papa.parse<RawRow>(fileText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const columnsFound = parsed.meta.fields ?? [];
  const missingColumns = EXPECTED_COLUMNS.filter((c) => !columnsFound.includes(c));

  const responses = parsed.data.map((raw, index) => toRow(raw, index));

  return {
    responses,
    totalRows: responses.length,
    columnsFound,
    missingColumns,
  };
}
