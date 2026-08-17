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
 * já escopado (ex: só Varejo) antes de aplicar os filtros do usuário. `initialFilters`
 * troca o padrão de "mês atual" (ex: telas de evolução mensal querem o ano inteiro).
 */
export function useDashboardFilters(base: NpsResponse[], initialFilters: () => Filters = defaultFilters) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const eligibleResponses = useMemo(() => base.filter(isElegivelNps), [base]);

  const yearOptions = useMemo(() => availableYears(base), [base]);

  // Cadeia de dependência: Segmento -> Marca -> Tipo de Produto -> Modelo -> Equipamento.
  // Cada nível calcula suas opções já restritas pelas seleções dos níveis anteriores,
  // então escolher um segmento só mostra marcas que existem naquele segmento, e assim por diante.
  const segmentoOptions = useMemo(
    () => optionLabels(groupBySegmentoConsolidado(eligibleResponses)),
    [eligibleResponses]
  );

  const afterSegmento = useMemo(() => {
    if (filters.segmentos.length === 0) return eligibleResponses;
    return eligibleResponses.filter((r) => filters.segmentos.includes(r.segmentoConsolidado ?? "Não classificado"));
  }, [eligibleResponses, filters.segmentos]);

  const marcaOptions = useMemo(() => optionLabels(byMarca(afterSegmento)), [afterSegmento]);

  const afterMarca = useMemo(() => {
    if (filters.marcas.length === 0) return afterSegmento;
    return afterSegmento.filter((r) => filters.marcas.includes(r.marca ?? "Não classificado"));
  }, [afterSegmento, filters.marcas]);

  const tipoProdutoOptions = useMemo(() => optionLabels(byEquipamentoOficial(afterMarca)), [afterMarca]);

  const afterTipoProduto = useMemo(() => {
    if (filters.tiposProduto.length === 0) return afterMarca;
    return afterMarca.filter((r) => filters.tiposProduto.includes(r.equipamentoOficial ?? "Não classificado"));
  }, [afterMarca, filters.tiposProduto]);

  const modeloOptions = useMemo(() => optionLabels(byBarebone(afterTipoProduto)), [afterTipoProduto]);

  const afterModelo = useMemo(() => {
    if (filters.modelos.length === 0) return afterTipoProduto;
    return afterTipoProduto.filter((r) => filters.modelos.includes(r.barebone ?? "Não classificado"));
  }, [afterTipoProduto, filters.modelos]);

  const equipmentOptions = useMemo(() => optionLabels(byEquipmentCategory(afterModelo)), [afterModelo]);

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
