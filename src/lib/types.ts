export type Classification = "promoter" | "passive" | "detractor";

export type ScoreStatus = "valid" | "no_response" | "invalid";

export interface QualityIssue {
  field: string;
  reason: string;
  raw: string;
}

export interface NpsResponse {
  id: string;
  createdAt: Date | null;
  contactName: string;
  contactPhone: string;
  chamado: string;
  equipmentRaw: string;
  equipmentCategory: string;
  segmento: string | null;
  sku: string | null;
  marca: string | null;
  equipamentoOficial: string | null;
  barebone: string | null;
  clienteUf: string | null;
  clienteNome: string | null;
  projeto: string | null;
  ct: string | null;
  ftDate: Date | null;
  encerramentoDate: Date | null;
  encerramentoDesc: string | null;
  tipo: string | null;
  serie: string | null;
  descricaoMaterial: string | null;
  modalDeEnvio: string | null;
  dataEntregaRetorno: string | null;
  utilizaPeca: string | null;
  segmentoConsolidado: string | null;
  problemaSolucionado: "sim" | "nao" | "sem_resposta";
  score: number | null;
  scoreStatus: ScoreStatus;
  scoreRaw: string;
  classification: Classification | null;
  /** NPS_produto do Power BI — mesma classificação promotor/neutro/detrator, mas em cima de avaliacaoProduto. */
  produtoClassification: Classification | null;
  motivoNota: string;
  satisfacaoAtp: number | null;
  avaliacaoProduto: number | null;
  comentario: string | null;
  dataChamado: Date | null;
  dataChamadoRaw: string;
  qualityIssues: QualityIssue[];
}

export interface ParseResult {
  responses: NpsResponse[];
  totalRows: number;
  columnsFound: string[];
  missingColumns: string[];
  duplicatesRemoved: number;
}

export interface Filters {
  dateFrom: string | null;
  dateTo: string | null;
  equipmentCategories: string[];
  segmentos: string[];
  marcas: string[];
  tiposProduto: string[];
  modelos: string[];
  chamado: string;
  search: string;
}
