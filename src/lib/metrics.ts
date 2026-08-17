import { tipoEncerramento, tipoEquipamento, tipoEquipamento2 } from "./chamadosRecente";
import { dateForRole, type DateRole } from "./filters";
import type { Classification, NpsResponse } from "./types";

export interface NpsSummary {
  nps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  validTotal: number;
}

function summarizeByClassification(
  responses: NpsResponse[],
  classificationOf: (r: NpsResponse) => Classification | null
): NpsSummary {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const r of responses) {
    const c = classificationOf(r);
    if (c === "promoter") promoters++;
    else if (c === "passive") passives++;
    else if (c === "detractor") detractors++;
  }

  const validTotal = promoters + passives + detractors;
  const nps = validTotal > 0 ? ((promoters - detractors) / validTotal) * 100 : null;

  return { nps, promoters, passives, detractors, validTotal };
}

export function summarizeNps(responses: NpsResponse[]): NpsSummary {
  return summarizeByClassification(responses, (r) => r.classification);
}

/** Produto_NPS do Power BI — mesma conta, só que em cima da avaliação do produto. */
export function summarizeNpsProduto(responses: NpsResponse[]): NpsSummary {
  return summarizeByClassification(responses, (r) => r.produtoClassification);
}

const MESES_VALIDOS_GOVCORP_2025 = new Set([3, 6, 7, 8, 9, 10, 11, 12]);

/**
 * NPS TOTAL do Power BI, ramo GOV/CORP: restringe a chamados de garantia (Tipo
 * Encerramento = GARANTIA) e, dentro de 2025, apaga os meses fora da janela de
 * pesquisa (jan/fev/abr/mai não tiveram pesquisa naquele ano). VAREJO e o
 * conjunto misto (todos os segmentos juntos) não têm essa restrição — são só
 * summarizeNps(filtered) mesmo, sem ajuste.
 */
export function govCorpNpsPopulation(responses: NpsResponse[]): NpsResponse[] {
  return responses.filter((r) => {
    if (r.encerramentoDate && r.encerramentoDate.getFullYear() === 2025) {
      const mes = r.encerramentoDate.getMonth() + 1;
      if (!MESES_VALIDOS_GOVCORP_2025.has(mes)) return false;
    }
    return tipoEncerramento(r) === "GARANTIA";
  });
}

/** NPS_GERAL do Power BI — cruza classificação de serviço x produto. */
export function npsGeral(r: NpsResponse): string {
  const servicoRuim = r.classification === "detractor" || r.classification === "passive";
  const produtoRuim = r.produtoClassification === "detractor" || r.produtoClassification === "passive";
  if (servicoRuim && produtoRuim) return "Detrator / Neutro Ambos";
  if (servicoRuim) return "Detrator Serviços";
  if (produtoRuim) return "Detrator Produto";
  return "Promotor";
}

/** Anos com pelo menos uma resposta na base — pra alimentar o seletor de Ano, mais recente primeiro. */
export function availableYears(responses: NpsResponse[]): number[] {
  const years = new Set<number>();
  const now = Date.now();
  for (const r of responses) {
    const date = r.dataChamado ?? r.createdAt;
    // data_do_chamado no futuro é erro de digitação na fonte, não um chamado real —
    // não oferece um ano fantasma no seletor de período por causa disso.
    if (date && date.getTime() <= now) years.add(date.getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function responseRate(responses: NpsResponse[]): number | null {
  if (responses.length === 0) return null;
  const noResponse = responses.filter((r) => r.scoreStatus === "no_response").length;
  return ((responses.length - noResponse) / responses.length) * 100;
}

export function averageOf(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

export function resolutionRate(responses: NpsResponse[]): number | null {
  const sim = responses.filter((r) => r.problemaSolucionado === "sim").length;
  const nao = responses.filter((r) => r.problemaSolucionado === "nao").length;
  const total = sim + nao;
  if (total === 0) return null;
  return (sim / total) * 100;
}

export interface MonthlyPoint extends NpsSummary {
  month: string;
  label: string;
  total: number;
  respRate: number | null;
  avgAvaliacao: number | null;
}

export function monthlyTrend(responses: NpsResponse[], dateRole: DateRole = "chamado"): MonthlyPoint[] {
  const buckets = new Map<string, NpsResponse[]>();

  for (const r of responses) {
    const date = dateForRole(r, dateRole);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }

  const monthLabels = [
    "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
  ];

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, list]) => {
      const summary = summarizeNps(list);
      const [year, m] = month.split("-");
      return {
        month,
        label: `${monthLabels[Number(m) - 1]}/${year.slice(2)}`,
        total: list.length,
        respRate: responseRate(list),
        avgAvaliacao: averageOf(list.map((r) => r.avaliacaoProduto)),
        ...summary,
      };
    });
}

export interface CategoryPoint extends NpsSummary {
  category: string;
}

export function byEquipmentCategory(responses: NpsResponse[]): CategoryPoint[] {
  const buckets = new Map<string, NpsResponse[]>();
  for (const r of responses) {
    const list = buckets.get(r.equipmentCategory) ?? [];
    list.push(r);
    buckets.set(r.equipmentCategory, list);
  }
  return [...buckets.entries()]
    .map(([category, list]) => ({ category, ...summarizeNps(list) }))
    .sort((a, b) => b.validTotal - a.validTotal);
}

function groupByKey(
  responses: NpsResponse[],
  keyFn: (r: NpsResponse) => string | null,
  fallback = "Não classificado"
): CategoryPoint[] {
  const buckets = new Map<string, NpsResponse[]>();
  for (const r of responses) {
    const key = keyFn(r) ?? fallback;
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }
  return [...buckets.entries()]
    .map(([category, list]) => ({ category, ...summarizeNps(list) }))
    .sort((a, b) => b.validTotal - a.validTotal);
}

export function bySegmento(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.segmento);
}

/** Segmento_novo_2 do Power BI — os 6 grupos combinados (VAREJO, CORP PLATAFORMA, GOV, CORP, HASS GOV, HASS CORP). */
export function groupBySegmentoConsolidado(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.segmentoConsolidado);
}

export function byMarca(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.marca);
}

export function byEquipamentoOficial(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.equipamentoOficial);
}

export function byBarebone(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.barebone);
}

/** Tipo Equipamento do Power BI (Chamados_Recente, por Barebone) — categoria mais granular que equipmentCategory. */
export function byTipoEquipamento(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => tipoEquipamento(r));
}

/** Tipo_Equipamento_2 do Power BI — colapsa os tablets, resto agrupado em OUTROS. */
export function byTipoEquipamento2(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => tipoEquipamento2(r));
}

/** NPS_GERAL do Power BI agrupado — quantas respostas caem em cada cruzamento serviço x produto. */
export function byNpsGeral(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => npsGeral(r));
}

export function byEstado(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.clienteUf);
}

export function byCt(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.ct);
}

export function byCliente(responses: NpsResponse[]): CategoryPoint[] {
  return groupByKey(responses, (r) => r.clienteNome);
}

export interface ClienteStat extends CategoryPoint {
  avgAvaliacao: number | null;
}

/** Agrupa por uma chave (cliente, CT, ...) com respostas/NPS/avaliação média — nada de "Não classificado". */
function statsByKey(responses: NpsResponse[], keyFn: (r: NpsResponse) => string | null): ClienteStat[] {
  const buckets = new Map<string, NpsResponse[]>();
  for (const r of responses) {
    const key = keyFn(r);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }
  return [...buckets.entries()]
    .map(([category, list]) => ({
      category,
      ...summarizeNps(list),
      avgAvaliacao: averageOf(list.map((r) => r.avaliacaoProduto)),
    }))
    .sort((a, b) => b.validTotal - a.validTotal);
}

/** Estatísticas por cliente para a tela de Análise por Cliente. */
export function clienteStats(responses: NpsResponse[]): ClienteStat[] {
  return statsByKey(responses, (r) => r.clienteNome);
}

/** Estatísticas por Centro de Trabalho para a tela de Análise por CT. */
export function ctStats(responses: NpsResponse[]): ClienteStat[] {
  return statsByKey(responses, (r) => r.ct);
}

/** Tira as opções "sem dado" (não classificado / não informado) de listas de filtro — só mostra categorias reais e já combinadas. */
const UNCLASSIFIED_LABELS = new Set(["Não classificado", "Não informado"]);

export function optionLabels(points: CategoryPoint[]): string[] {
  return points.map((p) => p.category).filter((c) => !UNCLASSIFIED_LABELS.has(c));
}

export function topByDetractors(points: CategoryPoint[], limit = 12): CategoryPoint[] {
  return points
    .filter((p) => p.detractors > 0)
    .slice()
    .sort((a, b) => b.detractors - a.detractors)
    .slice(0, limit);
}

export function topByPromoters(points: CategoryPoint[], limit = 12): CategoryPoint[] {
  return points
    .filter((p) => p.promoters > 0)
    .slice()
    .sort((a, b) => b.promoters - a.promoters)
    .slice(0, limit);
}

export interface ScorePoint {
  score: number;
  total: number;
}

export function byScore(responses: NpsResponse[]): ScorePoint[] {
  const counts = new Array(11).fill(0);
  for (const r of responses) {
    if (r.scoreStatus === "valid" && r.score !== null && r.score >= 0 && r.score <= 10) {
      counts[r.score]++;
    }
  }
  return counts.map((total, score) => ({ score, total }));
}

export interface MotivoPoint {
  motivo: string;
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  detractorRate: number;
}

export function byMotivo(responses: NpsResponse[]): MotivoPoint[] {
  const buckets = new Map<string, NpsResponse[]>();
  for (const r of responses) {
    if (r.motivoNota === "Sem resposta" || !r.classification) continue;
    const list = buckets.get(r.motivoNota) ?? [];
    list.push(r);
    buckets.set(r.motivoNota, list);
  }
  return [...buckets.entries()]
    .map(([motivo, list]) => {
      const summary = summarizeNps(list);
      return {
        motivo,
        total: summary.validTotal,
        promoters: summary.promoters,
        passives: summary.passives,
        detractors: summary.detractors,
        detractorRate: summary.validTotal > 0 ? (summary.detractors / summary.validTotal) * 100 : 0,
      };
    })
    .sort((a, b) => b.detractorRate - a.detractorRate);
}

export interface QualitySummary {
  totalRows: number;
  validScores: number;
  noResponse: number;
  invalidScores: number;
  invalidDates: number;
  issuesBySample: { field: string; reason: string; raw: string; id: string }[];
}

export function summarizeQuality(responses: NpsResponse[]): QualitySummary {
  let validScores = 0;
  let noResponse = 0;
  let invalidScores = 0;
  let invalidDates = 0;
  const issuesBySample: QualitySummary["issuesBySample"] = [];

  for (const r of responses) {
    if (r.scoreStatus === "valid") validScores++;
    else if (r.scoreStatus === "no_response") noResponse++;
    else if (r.scoreStatus === "invalid") invalidScores++;

    for (const issue of r.qualityIssues) {
      if (issue.field === "data_do_chamado") invalidDates++;
      if (issuesBySample.length < 200) {
        issuesBySample.push({ ...issue, id: r.id });
      }
    }
  }

  return {
    totalRows: responses.length,
    validScores,
    noResponse,
    invalidScores,
    invalidDates,
    issuesBySample,
  };
}
