import { normalizeKey } from "./text";
import type { Filters, NpsResponse } from "./types";

/** Grupos consolidados de segmento (Segmento_novo_2 do Power BI), calculados em segmento_consolidado. */
export const VAREJO_SEGMENTOS = ["VAREJO", "CORP PLATAFORMA"];
export const GOVCORP_SEGMENTOS = ["GOV", "CORP", "HASS GOV", "HASS CORP"];

export function bySegmentoConsolidado(responses: NpsResponse[], grupo: string[]): NpsResponse[] {
  return responses.filter((r) => r.segmentoConsolidado !== null && grupo.includes(r.segmentoConsolidado));
}

/**
 * Regras de elegibilidade pro NPS — chamados fora dessas listas não representam
 * atendimento real de assistência técnica e distorcem os números.
 * União das listas de filtrar_base.py e da especificação mais recente.
 */
const PROJETOS_EXCLUIR = new Set(
  [
    "H3-02956", "H3-03509", "H3-03229", "H3-03665", "H3-04145",
    "H5-00120", "H5-00119", "H5-00132", "H3-03752", "H3-02621",
    "H3-04035", "H5-00127",
  ].map(normalizeKey)
);

// Segmento vazio/não sincronizado NÃO entra aqui de propósito — hoje isso costuma
// significar só "falta reimportar o CSV de chamados", não um chamado inválido.
const SEGMENTOS_EXCLUIR = new Set(
  ["nao definido", "te-corpora", "te-governo", "te-varejo"].map(normalizeKey)
);

const MARCAS_PERMITIDAS = new Set(
  ["2AM", "ACCEPT", "AGROSMART", "ANKER", "COMPAQ", "INFINIX", "OUTROS", "POSITIVO", "QUANTUM", "VAIO"].map(normalizeKey)
);

export function isElegivelNps(r: NpsResponse): boolean {
  if (r.projeto && PROJETOS_EXCLUIR.has(normalizeKey(r.projeto))) return false;
  if (SEGMENTOS_EXCLUIR.has(normalizeKey(r.segmento ?? ""))) return false;
  if (r.marca && !MARCAS_PERMITIDAS.has(normalizeKey(r.marca))) return false;
  return true;
}

export const EMPTY_FILTERS: Filters = {
  dateFrom: null,
  dateTo: null,
  equipmentCategories: [],
  segmentos: [],
  marcas: [],
  tiposProduto: [],
  modelos: [],
  chamado: "",
  search: "",
};

/** Filtros padrão ao abrir o painel: mês atual já selecionado (data do chamado). */
export function defaultFilters(): Filters {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { ...EMPTY_FILTERS, dateFrom: month, dateTo: month };
}

/** Filtros padrão pra telas de evolução mensal: ano atual inteiro (jan-dez), sem mês específico. */
export function defaultYearFilters(): Filters {
  const year = new Date().getFullYear();
  return { ...EMPTY_FILTERS, dateFrom: `${year}-01`, dateTo: `${year}-12` };
}

/**
 * data_chamado, created_at (resposta) e FT (Fechamento Técnico) não são a mesma coisa —
 * um chamado pode ter data_chamado no futuro em relação a quando a pesquisa foi respondida.
 * "chamado" período por data_chamado (população de chamados no período, padrão);
 * "resposta" período por created_at (quando a pesquisa foi de fato respondida);
 * "ft" período pelo Fechamento Técnico do chamado — usado só em CORP PLATAFORMA.
 */
export type DateRole = "chamado" | "resposta" | "ft";

export function dateForRole(r: NpsResponse, role: DateRole): Date | null {
  if (role === "ft") return r.ftDate ?? r.dataChamado ?? r.createdAt;
  return role === "resposta" ? (r.createdAt ?? r.dataChamado) : (r.dataChamado ?? r.createdAt);
}

/** Parses a `YYYY-MM` filter value into the first day of that month (local time). */
function monthStart(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

/** First instant of the month *after* a `YYYY-MM` filter value — the exclusive upper bound. */
function monthEndExclusive(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]), 1);
}

export function applyFilters(responses: NpsResponse[], filters: Filters, dateRole: DateRole = "chamado"): NpsResponse[] {
  const from = filters.dateFrom ? monthStart(filters.dateFrom) : null;
  const toExclusive = filters.dateTo ? monthEndExclusive(filters.dateTo) : null;
  const search = filters.search.trim().toLowerCase();
  const chamado = filters.chamado.trim().toLowerCase();

  return responses.filter((r) => {
    if (!isElegivelNps(r)) return false;

    const date = dateForRole(r, dateRole);

    if (from && (!date || date < from)) return false;
    if (toExclusive && (!date || date >= toExclusive)) return false;

    if (
      filters.equipmentCategories.length > 0 &&
      !filters.equipmentCategories.includes(r.equipmentCategory)
    ) {
      return false;
    }

    if (filters.segmentos.length > 0) {
      const seg = r.segmentoConsolidado ?? "Não classificado";
      if (!filters.segmentos.includes(seg)) return false;
    }

    if (filters.marcas.length > 0) {
      const marca = r.marca ?? "Não classificado";
      if (!filters.marcas.includes(marca)) return false;
    }

    if (filters.tiposProduto.length > 0) {
      const tipo = r.equipamentoOficial ?? "Não classificado";
      if (!filters.tiposProduto.includes(tipo)) return false;
    }

    if (filters.modelos.length > 0) {
      const modelo = r.barebone ?? "Não classificado";
      if (!filters.modelos.includes(modelo)) return false;
    }

    if (chamado && !r.chamado.toLowerCase().includes(chamado)) return false;

    if (search) {
      const haystack = `${r.contactName} ${r.chamado} ${r.comentario ?? ""} ${r.equipmentRaw} ${r.barebone ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}
