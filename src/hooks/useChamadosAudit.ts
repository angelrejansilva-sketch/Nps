"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessage";
import { createClient } from "@/lib/supabase/client";
import {
  EMPTY_CHAMADOS_FILTERS,
  fetchChamadosPage,
  type ChamadoAuditRow,
  type ChamadosFilters,
} from "@/lib/supabase/chamadosQuery";

export function useChamadosAudit() {
  const [page, setPage] = useState(0);
  const [filters, setFiltersState] = useState<ChamadosFilters>(EMPTY_CHAMADOS_FILTERS);
  const [rows, setRows] = useState<ChamadoAuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const result = await fetchChamadosPage(supabase, page, filters);
      setRows(result.rows);
      setTotal(result.total);
    } catch (e) {
      setError(getErrorMessage(e, "Erro ao carregar chamados."));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const updateFilters = useCallback((next: ChamadosFilters) => {
    setPage(0);
    setFiltersState(next);
  }, []);

  const resetFilters = useCallback(() => {
    setPage(0);
    setFiltersState(EMPTY_CHAMADOS_FILTERS);
  }, []);

  return { page, setPage, filters, updateFilters, resetFilters, rows, total, loading, error };
}
