import type { Filters, NpsResponse } from "./types";

/** Grupos consolidados de segmento (Segmento_novo_2 do Power BI), calculados em segmento_consolidado. */
export const VAREJO_SEGMENTOS = ["VAREJO", "CORP PLATAFORMA"];
export const GOVCORP_SEGMENTOS = ["GOV", "CORP", "HASS GOV", "HASS CORP"];

export function bySegmentoConsolidado(responses: NpsResponse[], grupo: string[]): NpsResponse[] {
  return responses.filter((r) => r.segmentoConsolidado !== null && grupo.includes(r.segmentoConsolidado));
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

export function applyFilters(responses: NpsResponse[], filters: Filters): NpsResponse[] {
  const from = filters.dateFrom ? monthStart(filters.dateFrom) : null;
  const toExclusive = filters.dateTo ? monthEndExclusive(filters.dateTo) : null;
  const search = filters.search.trim().toLowerCase();
  const chamado = filters.chamado.trim().toLowerCase();

  return responses.filter((r) => {
    const date = r.dataChamado ?? r.createdAt;

    if (from && (!date || date < from)) return false;
    if (toExclusive && (!date || date >= toExclusive)) return false;

    if (
      filters.equipmentCategories.length > 0 &&
      !filters.equipmentCategories.includes(r.equipmentCategory)
    ) {
      return false;
    }

    if (filters.segmentos.length > 0) {
      const seg = r.segmento ?? "Não classificado";
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
