"use client";

import { useMemo, useState } from "react";
import { defaultFilters, isElegivelNps } from "@/lib/filters";
import {
  availableYears,
  byBarebone,
  byEquipamentoOficial,
  byEquipmentCategory,
  byMarca,
  groupBySegmentoConsolidado,
  optionLabels,
} from "@/lib/metrics";
import type { Filters, NpsResponse } from "@/lib/types";

/**
 * Estado de filtros + listas de opções compartilhado entre as telas (painel geral,
 * páginas de segmento, análise por cliente/CT). `base` é o conjunto de respostas
 * já escopado (ex: só Varejo) antes de aplicar os filtros do usuário.
 */
export function useDashboardFilters(base: NpsResponse[]) {
  const [filters, setFilters] = useState<Filters>(() => defaultFilters());

  const eligibleResponses = useMemo(() => base.filter(isElegivelNps), [base]);

  const yearOptions = useMemo(() => availableYears(base), [base]);
  const equipmentOptions = useMemo(() => optionLabels(byEquipmentCategory(eligibleResponses)), [eligibleResponses]);
  const segmentoOptions = useMemo(
    () => optionLabels(groupBySegmentoConsolidado(eligibleResponses)),
    [eligibleResponses]
  );
  const marcaOptions = useMemo(() => byMarca(base).map((c) => c.category), [base]);
  const tipoProdutoOptions = useMemo(
    () => optionLabels(byEquipamentoOficial(eligibleResponses)),
    [eligibleResponses]
  );
  const modeloOptions = useMemo(() => {
    const scoped =
      filters.tiposProduto.length > 0
        ? eligibleResponses.filter((r) => filters.tiposProduto.includes(r.equipamentoOficial ?? "Não classificado"))
        : eligibleResponses;
    return optionLabels(byBarebone(scoped));
  }, [eligibleResponses, filters.tiposProduto]);

  return {
    filters,
    setFilters,
    eligibleResponses,
    yearOptions,
    equipmentOptions,
    segmentoOptions,
    marcaOptions,
    tipoProdutoOptions,
    modeloOptions,
  };
}
