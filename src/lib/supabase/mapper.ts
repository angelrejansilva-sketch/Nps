import { categorizeEquipment } from "@/lib/classify";
import { parseScore } from "@/lib/normalize";
import type { NpsResponse, QualityIssue } from "@/lib/types";

export interface NpsResponseRow {
  source_id: string;
  chamado: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  equipment_raw: string | null;
  equipment_category: string | null;
  segmento: string | null;
  sku: string | null;
  marca: string | null;
  equipamento_oficial: string | null;
  barebone: string | null;
  problema_solucionado: "sim" | "nao" | "sem_resposta";
  score: number | null;
  score_status: "valid" | "no_response" | "invalid";
  score_raw: string | null;
  classification: "promoter" | "passive" | "detractor" | null;
  motivo_nota: string | null;
  satisfacao_atp: number | null;
  avaliacao_produto: number | null;
  comentario: string | null;
  data_chamado: string | null;
  data_chamado_raw: string | null;
  created_at_source: string | null;
}

export function dbRowToNpsResponse(row: NpsResponseRow): NpsResponse {
  const issues: QualityIssue[] = [];

  const scoreRaw = row.score_raw ?? "";
  const { issue: scoreIssue } = parseScore(scoreRaw);
  if (scoreIssue) issues.push(scoreIssue);

  const dataChamadoRaw = row.data_chamado_raw ?? "";
  if (dataChamadoRaw.trim() && !row.data_chamado) {
    issues.push({ field: "data_do_chamado", reason: "Data não reconhecida", raw: dataChamadoRaw });
  }

  return {
    id: row.source_id,
    createdAt: row.created_at_source ? new Date(row.created_at_source) : null,
    contactName: row.contact_name ?? "",
    contactPhone: row.contact_phone ?? "",
    chamado: row.chamado ?? "",
    equipmentRaw: row.equipment_raw ?? "",
    equipmentCategory: row.equipment_category ?? categorizeEquipment(row.equipment_raw ?? ""),
    segmento: row.segmento,
    sku: row.sku,
    marca: row.marca,
    equipamentoOficial: row.equipamento_oficial,
    barebone: row.barebone,
    problemaSolucionado: row.problema_solucionado,
    score: row.score,
    scoreStatus: row.score_status,
    scoreRaw,
    classification: row.classification,
    motivoNota: row.motivo_nota ?? "",
    satisfacaoAtp: row.satisfacao_atp,
    avaliacaoProduto: row.avaliacao_produto,
    comentario: row.comentario,
    dataChamado: row.data_chamado ? new Date(`${row.data_chamado}T00:00:00`) : null,
    dataChamadoRaw,
    qualityIssues: issues,
  };
}

export function npsResponseToDbRow(
  r: NpsResponse,
  importBatchId: string
): Omit<
  NpsResponseRow,
  "score_status" | "problema_solucionado" | "classification" | "segmento" | "sku" | "marca" | "equipamento_oficial" | "barebone"
> & {
  score_status: string;
  problema_solucionado: string;
  classification: string | null;
  import_batch_id: string;
} {
  return {
    source_id: r.id,
    chamado: r.chamado || null,
    contact_name: r.contactName || null,
    contact_phone: r.contactPhone || null,
    equipment_raw: r.equipmentRaw || null,
    equipment_category: r.equipmentCategory,
    problema_solucionado: r.problemaSolucionado,
    score: r.score,
    score_status: r.scoreStatus,
    score_raw: r.scoreRaw || null,
    classification: r.classification,
    motivo_nota: r.motivoNota || null,
    satisfacao_atp: r.satisfacaoAtp,
    avaliacao_produto: r.avaliacaoProduto,
    comentario: r.comentario,
    data_chamado: r.dataChamado ? formatDateOnly(r.dataChamado) : null,
    data_chamado_raw: r.dataChamadoRaw || null,
    created_at_source: r.createdAt ? r.createdAt.toISOString() : null,
    import_batch_id: importBatchId,
  };
}

function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
