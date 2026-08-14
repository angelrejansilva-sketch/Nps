import type { Filters, NpsResponse } from "./types";

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

export function applyFilters(responses: NpsResponse[], filters: Filters): NpsResponse[] {
  const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const to = filters.dateTo ? new Date(filters.dateTo) : null;
  const search = filters.search.trim().toLowerCase();
  const chamado = filters.chamado.trim().toLowerCase();

  return responses.filter((r) => {
    const date = r.dataChamado ?? r.createdAt;

    if (from && (!date || date < from)) return false;
    if (to && (!date || date > to)) return false;

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
