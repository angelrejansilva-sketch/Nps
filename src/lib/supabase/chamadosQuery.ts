import type { SupabaseClient } from "@supabase/supabase-js";

export const CHAMADOS_PAGE_SIZE = 50;

export interface ChamadosFilters {
  chamado: string;
  segmento: string;
  slaStatus: string;
  uf: string;
}

export const EMPTY_CHAMADOS_FILTERS: ChamadosFilters = {
  chamado: "",
  segmento: "",
  slaStatus: "",
  uf: "",
};

export interface ChamadoAuditRow {
  chamado: string;
  cliente_nome: string | null;
  detentor_nome: string | null;
  encerramento: string | null;
  serie: string | null;
  descricao_material: string | null;
  segmento: string | null;
  tipo: string | null;
  sla_status: string | null;
  cliente_uf: string | null;
}

const CHAMADOS_SELECT =
  "chamado, cliente_nome, detentor_nome, encerramento, serie, descricao_material, segmento, tipo, sla_status, cliente_uf";

export interface ChamadosPage {
  rows: ChamadoAuditRow[];
  total: number;
}

/**
 * Busca uma página de nps_chamados direto no Postgres — a tabela tem 270k+ linhas,
 * então nunca carregamos tudo no navegador como fazemos com nps_responses.
 */
export async function fetchChamadosPage(
  supabase: SupabaseClient,
  page: number,
  filters: ChamadosFilters
): Promise<ChamadosPage> {
  let query = supabase.from("nps_chamados").select(CHAMADOS_SELECT, { count: "exact" });

  if (filters.chamado.trim()) query = query.ilike("chamado", `%${filters.chamado.trim()}%`);
  if (filters.segmento) query = query.eq("segmento", filters.segmento);
  if (filters.slaStatus) query = query.eq("sla_status", filters.slaStatus);
  if (filters.uf) query = query.eq("cliente_uf", filters.uf);

  const from = page * CHAMADOS_PAGE_SIZE;
  const { data, error, count } = await query
    .order("chamado", { ascending: false })
    .range(from, from + CHAMADOS_PAGE_SIZE - 1);

  if (error) throw error;
  return { rows: (data as ChamadoAuditRow[] | null) ?? [], total: count ?? 0 };
}
