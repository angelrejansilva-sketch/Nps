import type { NpsResponse } from "./types";

export interface NpsSummary {
  nps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  validTotal: number;
}

export function summarizeNps(responses: NpsResponse[]): NpsSummary {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const r of responses) {
    if (r.classification === "promoter") promoters++;
    else if (r.classification === "passive") passives++;
    else if (r.classification === "detractor") detractors++;
  }

  const validTotal = promoters + passives + detractors;
  const nps = validTotal > 0 ? ((promoters - detractors) / validTotal) * 100 : null;

  return { nps, promoters, passives, detractors, validTotal };
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
}

export function monthlyTrend(responses: NpsResponse[]): MonthlyPoint[] {
  const buckets = new Map<string, NpsResponse[]>();

  for (const r of responses) {
    const date = r.dataChamado ?? r.createdAt;
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

export function bySegmento(responses: NpsResponse[]): CategoryPoint[] {
  const buckets = new Map<string, NpsResponse[]>();
  for (const r of responses) {
    const key = r.segmento ?? "Não classificado";
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }
  return [...buckets.entries()]
    .map(([category, list]) => ({ category, ...summarizeNps(list) }))
    .sort((a, b) => b.validTotal - a.validTotal);
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
