import { categorizeEquipment } from "@/lib/classify";
import { classify, parseFlexibleDate, parseScore } from "@/lib/normalize";
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
  cliente_uf: string | null;
  cliente_nome: string | null;
  projeto: string | null;
  ct: string | null;
  ft: string | null;
  encerramento: string | null;
  encerramento_desc: string | null;
  tipo: string | null;
  serie: string | null;
  descricao_material: string | null;
  modal_de_envio: string | null;
  data_entrega_retorno: string | null;
  utiliza_peca: string | null;
  segmento_consolidado: string | null;
  produto_valido: boolean | null;
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

/**
 * "01/01/2025" é um valor sentinela de "data desconhecida" usado em dois lotes de
 * importação da fonte (2.342 linhas na base inteira, bem acima do volume normal de
 * qualquer dia real) — não representa a data de abertura de fato do chamado.
 */
const DATA_CHAMADO_SENTINELA = "2025-01-01";

function dateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function sameDate(a: Date, b: Date): boolean {
  return dateOnly(a) === dateOnly(b);
}

/** Desfaz dia/mês, só válido quando o dia original é ≤ 12 (senão não existiria como mês). */
function trySwapDayMonth(date: Date): Date | null {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  if (day > 12) return null;
  return new Date(date.getFullYear(), day - 1, month);
}

/**
 * data_do_chamado às vezes vem com dia/mês trocados na fonte (padrão americano
 * MM/DD lido como se fosse DD/MM brasileiro) — o que faz a data cair depois do
 * próprio Encerramento/FT do chamado, o que é impossível. Quando desfazer a troca
 * bate exatamente com uma dessas datas confiáveis, usa a versão corrigida.
 */
function correctSwappedDataChamado(
  dataChamado: Date | null,
  encerramentoDate: Date | null,
  ftDate: Date | null
): Date | null {
  if (!dataChamado) return null;
  const isAfter = (ref: Date | null) => ref !== null && dateOnly(dataChamado) > dateOnly(ref);
  if (!isAfter(encerramentoDate) && !isAfter(ftDate)) return dataChamado;

  const swapped = trySwapDayMonth(dataChamado);
  if (!swapped) return dataChamado;
  if (encerramentoDate && sameDate(swapped, encerramentoDate)) return swapped;
  if (ftDate && sameDate(swapped, ftDate)) return swapped;
  return dataChamado;
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
  const dataChamadoSemSentinela = row.data_chamado === DATA_CHAMADO_SENTINELA ? null : row.data_chamado;
  const dataChamadoParsed = dataChamadoSemSentinela ? new Date(`${dataChamadoSemSentinela}T00:00:00`) : null;

  const ftDate = row.ft ? parseFlexibleDate(row.ft) : null;
  const encerramentoDate = row.encerramento ? parseFlexibleDate(row.encerramento) : null;
  const dataChamado = correctSwappedDataChamado(dataChamadoParsed, encerramentoDate, ftDate);

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
    clienteUf: row.cliente_uf,
    clienteNome: row.cliente_nome,
    projeto: row.projeto,
    ct: row.ct,
    ftDate,
    encerramentoDate,
    encerramentoDesc: row.encerramento_desc,
    tipo: row.tipo,
    serie: row.serie,
    descricaoMaterial: row.descricao_material,
    modalDeEnvio: row.modal_de_envio,
    dataEntregaRetorno: row.data_entrega_retorno,
    utilizaPeca: row.utiliza_peca,
    segmentoConsolidado: row.segmento_consolidado,
    produtoValido: row.produto_valido,
    problemaSolucionado: row.problema_solucionado,
    score: row.score,
    scoreStatus: row.score_status,
    scoreRaw,
    classification: row.classification,
    produtoClassification: classify(row.avaliacao_produto),
    motivoNota: row.motivo_nota ?? "",
    satisfacaoAtp: row.satisfacao_atp,
    avaliacaoProduto: row.avaliacao_produto,
    comentario: row.comentario,
    dataChamado,
    dataChamadoRaw,
    qualityIssues: issues,
  };
}

export function npsResponseToDbRow(
  r: NpsResponse,
  importBatchId: string
): Omit<
  NpsResponseRow,
  | "score_status"
  | "problema_solucionado"
  | "classification"
  | "segmento"
  | "sku"
  | "marca"
  | "equipamento_oficial"
  | "barebone"
  | "cliente_uf"
  | "cliente_nome"
  | "projeto"
  | "ct"
  | "ft"
  | "encerramento"
  | "encerramento_desc"
  | "tipo"
  | "serie"
  | "descricao_material"
  | "modal_de_envio"
  | "data_entrega_retorno"
  | "utiliza_peca"
  | "segmento_consolidado"
  | "produto_valido"
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
