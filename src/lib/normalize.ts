import { normalizeKey } from "./text";
import type { Classification, QualityIssue, ScoreStatus } from "./types";

const NO_RESPONSE_TOKENS = new Set(
  [
    "nao respondeu",
    "não respondeu",
    "abandonou a pesquisa",
    "optou por responder em outro momento",
    "",
  ].map(normalizeKey)
);

export function parseScore(raw: string): {
  score: number | null;
  status: ScoreStatus;
  issue?: QualityIssue;
} {
  const trimmed = raw.trim();
  const key = normalizeKey(trimmed);

  if (NO_RESPONSE_TOKENS.has(key)) {
    return { score: null, status: "no_response" };
  }

  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (n >= 0 && n <= 10) {
      return { score: n, status: "valid" };
    }
    return {
      score: null,
      status: "invalid",
      issue: { field: "recomendar_servico", reason: "Nota fora da faixa 0-10", raw },
    };
  }

  return {
    score: null,
    status: "invalid",
    issue: { field: "recomendar_servico", reason: "Valor não reconhecido", raw },
  };
}

export function classify(score: number | null): Classification | null {
  if (score === null) return null;
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export function parseProblemaSolucionado(raw: string): "sim" | "nao" | "sem_resposta" {
  const key = normalizeKey(raw);
  if (["sim", "si", "meu problema foi resolvido"].includes(key)) return "sim";
  if (["nao", "no", "meu problema nao foi resolvido"].includes(key)) return "nao";
  return "sem_resposta";
}

const MOTIVO_CANONICAL: Record<string, string> = {
  "outro / envie sua mensagem ou audio": "Outro",
  outro: "Outro",
  "qualidade do servico": "Qualidade do serviço",
  "calidad del servicio": "Qualidade do serviço",
  "tempo de reparo": "Tempo de reparo",
  "tiempo de reparacion": "Tempo de reparo",
  "clareza e eficiencia": "Clareza e eficiência",
  "atendimento cordial": "Atendimento cordial",
  "cordialidade no atendimento": "Atendimento cordial",
};

export function normalizeMotivo(raw: string): string {
  const key = normalizeKey(raw);
  if (NO_RESPONSE_TOKENS.has(key)) return "Sem resposta";
  return MOTIVO_CANONICAL[key] ?? raw.trim();
}

function parseIntOrNull(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (n < min || n > max) return null;
  return n;
}

export function parseSatisfacaoAtp(raw: string): number | null {
  return parseIntOrNull(raw, 1, 5);
}

export function parseAvaliacaoProduto(raw: string): number | null {
  return parseIntOrNull(raw, 0, 10);
}

const COMMENT_PLACEHOLDERS = new Set(
  ["sem comentarios", "sem comentario", "nao", "não", "n/a", "na", "-", "."].map(normalizeKey)
);

export function normalizeComment(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const key = normalizeKey(trimmed);
  if (NO_RESPONSE_TOKENS.has(key)) return null;
  if (COMMENT_PLACEHOLDERS.has(key)) return null;
  return trimmed;
}

const MONTHS = /^\d{4}-\d{2}-\d{2}/;
const DMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseFlexibleDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (MONTHS.test(trimmed)) {
    const d = new Date(trimmed.replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const dmyMatch = trimmed.match(DMY);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}
