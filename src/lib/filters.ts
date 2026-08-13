import type { Filters, NpsResponse } from "./types";

export const EMPTY_FILTERS: Filters = {
  dateFrom: null,
  dateTo: null,
  equipmentCategories: [],
  search: "",
};

export function applyFilters(responses: NpsResponse[], filters: Filters): NpsResponse[] {
  const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const to = filters.dateTo ? new Date(filters.dateTo) : null;
  const search = filters.search.trim().toLowerCase();

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

    if (search) {
      const haystack = `${r.contactName} ${r.chamado} ${r.comentario ?? ""} ${r.equipmentRaw}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}
