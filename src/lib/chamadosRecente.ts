/**
 * Réplica em JS das colunas calculadas da tabela `Chamados_Recente` do Power BI
 * que ainda não existiam no domínio: Tipo Encerramento, Tipo Equipamento (por
 * Barebone), Entregue_Cliente e os mapas de estado por UF.
 */
import { normalizeKey, stripAccents } from "./text";

type ChamadoLike = {
  encerramentoDesc: string | null;
  tipo: string | null;
};

/** Remove acentos, baixa a caixa e troca qualquer caractere não alfanumérico por espaço — tolera "?" no lugar de "Ç"/"Ã" que aparece em exports mal codificados. */
function normLabel(value: string | null | undefined): string {
  return stripAccents((value ?? "").trim().toLowerCase())
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TROCA_CRP_TIPOS = new Set([
  "troca aprovada crp",
  "troca aprovada outros",
  "troca aprovada posta rest",
  "troca aprovada juridico",
]);
const TROCA_ATP_TIPOS = new Set(["troca aprovada atp", "troca aprovada gcon"]);

// "CANCELADO - OR?AMENTO NAO APROVADO" no DAX original — "?" no lugar de "Ç"/"Ã" mal codificado.
const CANCELADO_NAO_APROVADO_RE = /^cancelado.*\bnao\b.*aprovado$/;

/** Tipo Encerramento do Power BI — GARANTIA é o valor padrão (chamado normal, sem orçamento/troca). */
export function tipoEncerramento(r: ChamadoLike): string {
  const desc = normLabel(r.encerramentoDesc);
  const tipo = normLabel(r.tipo);

  if (desc === "orcamento" || desc === "fora de garantia") return "ORÇAMENTO";
  if (desc === "orcamento aprovado") return "ORÇAMENTO APROVADO";
  if (CANCELADO_NAO_APROVADO_RE.test(desc)) return "ORÇAMENTO NÃO APROVADO";
  if (desc === "encerramento" && tipo === "solicitacao de orcamento") return "ORÇAMENTO";
  if (TROCA_CRP_TIPOS.has(tipo)) return "TROCA CRP";
  if (desc === "encerramento com negociacao" || TROCA_ATP_TIPOS.has(tipo)) return "TROCA ATP";
  if (desc === "encerramento falha nao encontrada" && tipo === "solicitacao de orcamento") return "ORÇAMENTO";
  return "GARANTIA";
}

/** Entregue_Cliente do Power BI. */
export function entregueCliente(r: {
  modalDeEnvio: string | null;
  dataEntregaRetorno: string | null;
  encerramentoDesc: string | null;
}): "Entregue" | "Não Entregue" {
  const modal = normLabel(r.modalDeEnvio);
  const semEntrega = !r.dataEntregaRetorno || !r.dataEntregaRetorno.trim();
  const desc = normLabel(r.encerramentoDesc);
  if (modal === "eticket" && semEntrega && desc !== "encerramento com negociacao") {
    return "Não Entregue";
  }
  return "Entregue";
}

// ---------------------------------------------------------------------------
// Tipo Equipamento (Chamados_Recente, por Barebone/descricao_material)
// ---------------------------------------------------------------------------

interface EquipamentoRule {
  category: string;
  barebones?: string[];
  descricaoMateriais?: string[];
}

const TIPO_EQUIPAMENTO_RULES: EquipamentoRule[] = [
  {
    category: "MONITOR",
    barebones: [
      "22BN550Y", "22MP55PJ", "22MP55PQ", "24BL550J", "24BN650U", "24P1U",
      "LF24T450FQLMZD", "OUTROS", "SE18N_PBM", "43UM5N-H", "20M35TD", "M2300",
      "22B3HMF", "24E3UF",
    ],
  },
  {
    category: "ALL IN ONE",
    barebones: ["A215U2", "ADPT2", "DC8CR01", "DH8BT11", "DH8BU01", "DH8KL01", "W2150G", "W2150G_V2", "ADPT2R", "DH3BU01", "DH8BW01"],
    descricaoMateriais: [
      "POSITIVO MASTER A6200 F162566XE",
      "POSITIVO MASTER A6200 F165126XC",
      "POSITIVO MASTER A6200 F7512N2XC-2",
    ],
  },
  {
    category: "NOTEBOOK POSITIVO",
    barebones: [
      "ARN50", "CF40CM", "CF40CM_V2", "CG15D12P", "CG15DP2", "CHT14B", "CW14Q01P_V2",
      "DN50E", "DN50E_RPL", "H14BT58", "J14AL", "J14GL11", "J14KR11", "JN1", "K116",
      "K116N", "K116R", "K142", "K142_V2", "K1424G_V2", "M14KL01", "M14KR01", "N14AP6",
      "N14AP7", "N14DP6", "N14DP7", "N14DP7_V2", "N14DP9", "N14DP9R", "N14EP6", "N14KP6",
      "N14KP6_TG", "N14ZP6", "N14ZP7", "N15EPE", "N15KP6_TGP", "N15NPE", "N240BU",
      "N240WU", "NL40CU1", "NL40MU1", "NP11G_E", "S14BW01", "S14CT01", "S14SL01",
      "V142N", "V142R", "V142R2", "YP11G_E", "N1103", "N14UP6", "POS_SIPWOAA",
      "S15SL01", "W942S", "CW14Q01P", "V116", "N15EPE-S", "K116J", "N14JP9R", "N15NPE-S",
    ],
    descricaoMateriais: [
      "POS MASTER N6440 H3-04328 IT03",
      "POS MASTER N8440 BB/SP H3-04039 IOS",
      "POS MASTER N8440 H3-04328 IT04 CEETEPS",
      "POSITIVO MASTER N6450 F1625670A",
      "POSITIVO MASTER N6440 H3-03727",
      "POS MASTER N8440 H3-4328 IT4 SEDUC 45",
      "POS MASTER N6445 H3-04221 IOS",
    ],
  },
  { category: "TOTEM", barebones: ["AT4400"] },
  {
    category: "SERVIDOR",
    barebones: ["CLIENT 4K", "SERVIDOR", "SMART"],
    descricaoMateriais: [
      "UPD SSG-640P-E1CR24H - CONFIGURACAO XEON",
      "UPD SYS-621P-TR - CONFIGURACAO XEON 6430",
      "UPD SYS-221H-TN24R - CONFIGURACAO XEON 6",
      "SRV PS&S AS-5126GS-TNRT2 19731794",
    ],
  },
  {
    category: "DESKTOP",
    barebones: [
      "DTH100DG", "POS_EIBTPDC", "POS_EIH110EA", "POS_EIH310EF", "POS_EIH610EX",
      "POS_PIB150DT", "POS_RAA320EI", "POS_RAA520FC", "POS_RIB360EE", "POS_RIH510EZ",
      "POS_RIH610FE", "POS_RIQ370ED", "POS_AIQ270DX", "POS_EIB85CZ", "POS_PIH110DV",
      "POS_PIH81DL", "POS_RIQ670FF", "POS_EIALDW",
    ],
    descricaoMateriais: [
      "POS MASTER D3400 ST8256NNEH610XCN0-2",
      "POS MASTER D3500 H3-04452 CINCA-SC IT2",
      "POS MASTER D3400 SSC512NNFH6100AN0-2",
      "POS MASTER D3400 SFC512NNEH610XCN0-3",
      "POSITIVO MASTER D3400 STC512NNEH610XCN0",
    ],
  },
  {
    category: "MINIPRO",
    barebones: [
      "GB3B_LPDDR4X", "POS_PIB150DP", "POS_PIQ170DS", "POS_RAA320EJ", "POS_RAX300ES",
      "POS_RIB360EC", "POS_RIH470EM", "POS_RIH670EU", "POS_RIH670FA", "POS_RIQ270DY",
      "POS_RIQ370EB", "POS_RIQ470EN", "POS_RIQ670EV", "POS_RIQ670FB", "POS_PIG41BU",
      "POS_RIH610FD", "POS_RIH670FA_R2", "POS_RAX300ES_R2",
    ],
    descricaoMateriais: [
      "POS MASTER C4400 H3-03965 BB R2 TCC",
      "POSITIVO MASTER C3400 MINIPRO F16256N6XE",
      "POS MASTER C6400 MINIPRO FC512N20A-6",
      "POS MASTER C6400 H3-03859 DETRAN IT1",
      "POS MASTER C4400 MINIPRO H8256N2AA-2",
      "POSITIVO MASTER C6400 MINIPRO T8256N2XC",
      "POSITIVO MASTER C6400 MINIPRO FD512N1XC",
      "POSITIVO MASTER C8400, M2301, MOUSE",
      "POS MASTER C4400 H3-04510",
    ],
  },
  { category: "IMC", barebones: ["IMC"] },
  { category: "CHROMEBOOK", barebones: ["LI7_CONVERTIBLE", "LI9B_CONVERTIBLE", "SG20JL1", "CH1190"] },
  {
    category: "VAIO",
    barebones: [
      "N14EPA", "N14EPA_V2", "N14LP6", "N14LP6_PRO", "N14LP6_PRO_V2", "N14LP6_V2",
      "N14TP6_PRO", "N14TP6_PRO_V2", "N14TP6_V2", "N14WP6", "N14WP6_C", "N14WP6_V2",
      "N15EPA", "N15EPA_V2", "N15LP6", "N15LP6_PRO", "N15LP6_RPL", "N15LP6_V2",
      "N15TP6", "N15TP6_V2", "N15WP6", "N15WP6_C", "N15WP6_V2", "NF50WU", "NP55RNA_V",
      "NP55RNB_V", "NP55RNH_V", "NP55RNJ_V", "S14SL03", "SX14", "TERRA", "VAIO_Z",
      "HKDE", "N16EPA", "N250JU", "N250WU", "S14KL13", "VJSE41", "N16LP6", "N16LP6_RPL",
    ],
    descricaoMateriais: [
      "VAIO FE16 VJFE62F11X-B0321H", "VAIO FE15 VJFE54F11X-B1511H", "VAIO FE16 VJFE62F11X-B0331H",
      "VAIO FE16 VJFE62F11X-B0611H", "VAIO FE16 VJFE62F11X-B0711H", "VAIO FE16 VJFE69F11X-B1511H",
      "VAIO PRO BK PC8970C11X-B2111H", "VAIO PRO BK PC8970C11X-B2611H", "VAIO PRO BK PC8970C11X-B2511H",
      "VAIO PRO BK PC8970C11X-B3521H", "VAIO PRO BK PC8970C11X-B3411H", "VAIO PRO BK PC8970C11X-B4811H",
    ],
  },
  {
    category: "VAIO TABLET",
    barebones: ["TL10", "TL12"],
    descricaoMateriais: ["TABLET VAIO TL12 VJTL21B0311B", "TABLET VAIO TL12 VJTL21B0211B"],
  },
  { category: "COMPAQ", barebones: ["N14JP6", "N14JP6_V2", "N14KP6_PRO", "N14KP6_PRO_V2", "N15QPE"] },
  { category: "OUTROS", barebones: ["NAO_APLICA", "OLD", "PST-CAN-D101", "PST-VPB-3016"] },
  { category: "2A.M", barebones: ["NB50TH"] },
  { category: "PDV", barebones: ["PDV C4"] },
  {
    category: "FEATURE PHONE",
    barebones: ["P26", "P26 4G", "P28B", "P38", "P41", "P50", "P51", "P30", "P220", "P70S", "P65", "P36V", "P15S", "P25"],
  },
  {
    category: "SMARTPHONE",
    barebones: [
      "Q20", "S431", "S431B", "S432", "S509_4G", "S509C", "S509N", "S512", "S513",
      "S514", "S518", "S518C", "S532", "S533", "S541", "S545", "S620", "S640", "S650",
      "S430B", "S509", "T1522", "S520",
    ],
  },
  { category: "SANTANDER", barebones: ["SANTANDER"] },
  {
    category: "CASA INTELIGENTE",
    barebones: [
      "SH_CAMERA", "SH_ROBO_ASP", "SH_ROBO_PRA1000", "SH_ROBO_PRA100", "SH_ROBO_PRA500",
      "SH_ROBO_PRA600", "SH_ROBO_PRA2000", "SH_ROBO_PRA800", "SH_FECHADURA", "SH_LAMP",
      "SH_KIT_CASA_CON", "SH_CONTR_UNIV", "SH_LAMP_RGB", "SH_PLUG", "SH_KEYPAD",
      "SH_BOCAL_WIFI", "SH_KIT_CASA_EFI", "SH_LUM_MESA", "SH_LAMP_VINTAGE", "SH_LAMP_SPOT",
      "SH_ALIMENTADOR", "SH_KIT_NVR", "SH_ROT_FAST", "SH_LUM_SPOT", "SH_INTERRUPTOR",
      "SH_LED", "SH_ROT_GIGA", "SH_ROBO_PRA90",
    ],
  },
  {
    category: "TABLET POSITIVO",
    barebones: [
      "T1060", "T1085", "T2040", "T2040B", "T2040C", "T2050C", "T2080", "T770C", "T770E",
      "T770F", "T770G", "T770KC", "T770KE", "T770KLG", "T770KM", "T770KMF", "T770KMG",
      "T770KSF", "T770KSG", "T780F", "T780G", "T780LF", "T780LG", "T780MF", "T780MG",
      "T780SF", "T780SG", "T800", "T810", "T810B", "T810C", "T820C", "T770KNME", "T770KF",
      "T1075", "T2070D",
    ],
  },
  {
    category: "TABLET VISION",
    barebones: [
      "T3010D", "T307128F", "T307128G", "T30764G", "T307MBG", "T307MOG", "T307STF",
      "T307STG", "T307SPF", "T30764F", "T307MNF", "T307MOF", "T307SPG", "T307MBF",
      "T307MNG", "T307TSF",
    ],
  },
  { category: "UNIMED", barebones: ["UNIMED"] },
  { category: "SMART WATCH POSITIVO", barebones: ["WATCH ESSENTIAL", "WATCH S3 V2"] },
  {
    category: "INFINIX",
    barebones: [
      "X6511E", "X6515", "X6525B", "X6525C", "X6528B", "X6531B", "X657B", "X665E",
      "X666B", "X669C", "X6711", "X676B", "X6812B", "X6831", "X6852", "X688B", "X689F",
      "X695", "X695C", "ZERO_5G", "NOTE 50X", "SMART 10",
    ],
    descricaoMateriais: ["INFINIX SMART 10 PRATA PST"],
  },
  { category: "SMART WATCH INFINIX", barebones: ["XWATCH 3", "WATCH S5", "WATCH S3"] },
  { category: "BOTICARIO", barebones: ["BOTICARIO"] },
];

const BAREBONE_TO_CATEGORY = new Map<string, string>();
const DESCRICAO_TO_CATEGORY = new Map<string, string>();
for (const rule of TIPO_EQUIPAMENTO_RULES) {
  for (const b of rule.barebones ?? []) {
    const key = normalizeKey(b);
    if (!BAREBONE_TO_CATEGORY.has(key)) BAREBONE_TO_CATEGORY.set(key, rule.category);
  }
  for (const d of rule.descricaoMateriais ?? []) {
    const key = normalizeKey(d);
    if (!DESCRICAO_TO_CATEGORY.has(key)) DESCRICAO_TO_CATEGORY.set(key, rule.category);
  }
}

/** Tipo Equipamento do Power BI (Chamados_Recente, por Barebone/descricao_material). */
export function tipoEquipamento(r: { barebone: string | null; descricaoMaterial: string | null }): string {
  if (r.barebone) {
    const cat = BAREBONE_TO_CATEGORY.get(normalizeKey(r.barebone));
    if (cat) return cat;
  }
  if (r.descricaoMaterial) {
    const cat = DESCRICAO_TO_CATEGORY.get(normalizeKey(r.descricaoMaterial));
    if (cat) return cat;
  }
  return "NÃO IDENTIFICADO";
}

/** Tipo_Equipamento_2 do Power BI — colapsa os tablets, resto vira OUTROS. */
export function tipoEquipamento2(r: { barebone: string | null; descricaoMaterial: string | null }): string {
  const tipo = tipoEquipamento(r);
  if (tipo === "TABLET POSITIVO" || tipo === "TABLET VISION") return "TABLET POSITIVO";
  if (tipo === "VAIO TABLET") return "VAIO TABLET";
  return "OUTROS";
}

// ---------------------------------------------------------------------------
// cliente_estado / cliente_estado_Sem_Acento
// ---------------------------------------------------------------------------

const ESTADOS: Record<string, [string, string]> = {
  AC: ["Acre", "Acre"],
  AL: ["Alagoas", "Alagoas"],
  AP: ["Amapá", "Amapa"],
  AM: ["Amazonas", "Amazonas"],
  BA: ["Bahia", "Bahia"],
  CE: ["Ceará", "Ceara"],
  DF: ["Distrito Federal", "Distrito Federal"],
  ES: ["Espírito Santo", "Espirito Santo"],
  GO: ["Goiás", "Goias"],
  MA: ["Maranhão", "Maranhao"],
  MT: ["Mato Grosso", "Mato Grosso"],
  MS: ["Mato Grosso do Sul", "Mato Grosso do Sul"],
  MG: ["Minas Gerais", "Minas Gerais"],
  PA: ["Pará", "Para"],
  PB: ["Paraíba", "Paraiba"],
  PR: ["Paraná", "Parana"],
  PE: ["Pernambuco", "Pernambuco"],
  PI: ["Piauí", "Piaui"],
  RJ: ["Rio de Janeiro", "Rio de Janeiro"],
  RN: ["Rio Grande do Norte", "Rio Grande do Norte"],
  RS: ["Rio Grande do Sul", "Rio Grande do Sul"],
  RO: ["Rondônia", "Rondonia"],
  RR: ["Roraima", "Roraima"],
  SC: ["Santa Catarina", "Santa Catarina"],
  SP: ["São Paulo", "Sao Paulo"],
  SE: ["Sergipe", "Sergipe"],
  TO: ["Tocantins", "Tocantins"],
};

export function clienteEstado(uf: string | null): string {
  if (!uf) return "UF inválida";
  return ESTADOS[uf.trim().toUpperCase()]?.[0] ?? "UF inválida";
}

export function clienteEstadoSemAcento(uf: string | null): string {
  if (!uf) return "UF inválida";
  return ESTADOS[uf.trim().toUpperCase()]?.[1] ?? "UF inválida";
}
