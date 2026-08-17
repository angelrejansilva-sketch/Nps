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

/** Barebones excluídos do Chamados_Recente (Power BI) — kits/linhas descontinuadas. */
const BAREBONES_EXCLUIR = new Set(
  ["L300", "L400", "UE2020", "UE2022", "S350", "CIELO_LIO_L2"].map(normalizeKey)
);

const CLIENTES_EXCLUIR = new Set(["CAIXA ECONOMICA FEDERAL"].map(normalizeKey));

/** Encerramento >= 01/12/2024 no Chamados_Recente do Power BI. */
const CHAMADOS_RECENTE_CUTOFF = new Date(2024, 11, 1);

// Quando preenchido, Encerramento_desc precisa estar nessa lista — igual ao Power BI.
// Em branco NÃO exclui de propósito (mesmo raciocínio do segmento acima): hoje ~metade
// das respostas ainda não bateu com a base de Chamados Encerrados, e tratar isso como
// "inelegível" derrubaria o NPS por lacuna de sincronização, não por chamado inválido.
const ENCERRAMENTO_DESC_PERMITIDOS = new Set(
  [
    "COLA SCANNER", "ENCERRAMENTO", "ENCERRAMENTO - FALHA NÃO ENCONTRADA",
    "ENCERRAMENTO COM NEGOCIAÇÃO", "ORÇAMENTO APROVADO",
  ].map(normalizeKey)
);

const TIPO_PERMITIDOS = new Set(
  [
    "ATENDIMENTO ON SITE", "PEDIDO FORA DA COMPOSIÇÃO", "SOLICITAÇÃO DE ORÇAMENTO",
    "SUPORTE TÉCNICO HW", "TROCA APROVADA - ATP", "TROCA APROVADA - CRP",
    "TROCA APROVADA - GCON", "TROCA APROVADA - JURÍDICO", "TROCA APROVADA - OUTROS",
    "TROCA APROVADA - POSTA REST", "ENCERRAMENTO COM NEGOCIAÇÃO",
  ].map(normalizeKey)
);

const TIPO_ENCERRAMENTO_COM_NEGOCIACAO = normalizeKey("ENCERRAMENTO COM NEGOCIAÇÃO");
const TIPOS_TROCA_APROVADA = new Set(
  [
    "TROCA APROVADA - CRP", "TROCA APROVADA - GCON", "TROCA APROVADA - JURÍDICO",
    "TROCA APROVADA - OUTROS", "TROCA APROVADA - POSTA REST",
  ].map(normalizeKey)
);

export function isElegivelNps(r: NpsResponse): boolean {
  if (r.projeto && PROJETOS_EXCLUIR.has(normalizeKey(r.projeto))) return false;
  if (SEGMENTOS_EXCLUIR.has(normalizeKey(r.segmento ?? ""))) return false;
  if (r.marca && !MARCAS_PERMITIDAS.has(normalizeKey(r.marca))) return false;
  if (r.barebone && BAREBONES_EXCLUIR.has(normalizeKey(r.barebone))) return false;
  if (r.clienteNome && CLIENTES_EXCLUIR.has(normalizeKey(r.clienteNome))) return false;
  if (r.encerramentoDate && r.encerramentoDate < CHAMADOS_RECENTE_CUTOFF) return false;

  if (r.encerramentoDesc && !ENCERRAMENTO_DESC_PERMITIDOS.has(normalizeKey(r.encerramentoDesc))) {
    return false;
  }

  if (r.tipo) {
    const tipoKey = normalizeKey(r.tipo);
    if (!TIPO_PERMITIDOS.has(tipoKey)) return false;

    // Regras especiais 2025: negociação só até agosto, trocas aprovadas só a partir de setembro.
    if (r.encerramentoDate && r.encerramentoDate.getFullYear() === 2025) {
      const mes = r.encerramentoDate.getMonth() + 1;
      if (tipoKey === TIPO_ENCERRAMENTO_COM_NEGOCIACAO && mes > 8) return false;
      if (TIPOS_TROCA_APROVADA.has(tipoKey) && mes < 9) return false;
    }
  }

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
 * Toda página escopa sua população pelo MESMO campo de data — nunca um pra "enviadas"
 * e outro pra "válidas"/NPS, senão os dois números deixam de bater (válidas > enviadas).
 * "chamado" período por data_chamado (padrão); "ft" período pelo Fechamento Técnico,
 * usado só em CORP PLATAFORMA. Tudo mais (válidas, NPS, motivo, avaliação, tendência)
 * é sempre um subconjunto dessa mesma população já filtrada.
 */
export type DateRole = "chamado" | "ft";

export function dateForRole(r: NpsResponse, role: DateRole): Date | null {
  if (role === "ft") return r.ftDate ?? r.dataChamado ?? r.createdAt;
  return r.dataChamado ?? r.createdAt;
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
