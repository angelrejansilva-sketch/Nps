import type { NpsResponse } from "./types";
import {
  averageOf,
  byBarebone,
  byEquipamentoOficial,
  byEquipmentCategory,
  byMarca,
  byMotivo,
  bySegmento,
  monthlyTrend,
  resolutionRate,
  responseRate,
  summarizeNps,
} from "./metrics";

/**
 * Builds a compact, aggregate-only snapshot of the current (filtered) dataset
 * for the AI analysis feature. Never includes contact name/phone or chamado
 * numbers — only anonymized comment snippets and pre-aggregated metrics.
 */
export function buildAiDataSummary(filtered: NpsResponse[], total: number) {
  const summary = summarizeNps(filtered);

  const comentarios = filtered
    .filter((r) => r.comentario && r.comentario.trim().length > 0)
    .slice(0, 120)
    .map((r) => ({
      classificacao: r.classification,
      motivo: r.motivoNota,
      segmento: r.segmento,
      comentario: r.comentario,
    }));

  return {
    totalRespostasNaBase: total,
    totalRespostasNoFiltro: filtered.length,
    nps: {
      score: summary.nps,
      promotores: summary.promoters,
      neutros: summary.passives,
      detratores: summary.detractors,
      respostasValidas: summary.validTotal,
    },
    taxaDeResposta: responseRate(filtered),
    taxaDeResolucao: resolutionRate(filtered),
    avaliacaoMediaProduto: averageOf(filtered.map((r) => r.avaliacaoProduto)),
    satisfacaoMediaAtp: averageOf(filtered.map((r) => r.satisfacaoAtp)),
    evolucaoMensal: monthlyTrend(filtered),
    porEquipamento: byEquipmentCategory(filtered).slice(0, 20),
    porSegmento: bySegmento(filtered),
    porMarca: byMarca(filtered).slice(0, 20),
    porModeloBarebone: byBarebone(filtered).slice(0, 20),
    porTipoProdutoOficial: byEquipamentoOficial(filtered).slice(0, 20),
    porMotivoDaNota: byMotivo(filtered).slice(0, 30),
    amostraDeComentarios: comentarios,
  };
}

export type AiDataSummary = ReturnType<typeof buildAiDataSummary>;
