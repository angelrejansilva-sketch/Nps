import { formatNumber, formatPercent } from "@/lib/format";
import type { NpsResponse } from "@/lib/types";

export function ResolutionBar({ responses }: { responses: NpsResponse[] }) {
  const sim = responses.filter((r) => r.problemaSolucionado === "sim").length;
  const nao = responses.filter((r) => r.problemaSolucionado === "nao").length;
  const semResposta = responses.filter((r) => r.problemaSolucionado === "sem_resposta").length;
  const total = sim + nao + semResposta || 1;

  const segments = [
    { key: "sim", label: "Sim", value: sim, color: "var(--status-good)" },
    { key: "nao", label: "Não", value: nao, color: "var(--status-critical)" },
    { key: "sem_resposta", label: "Não respondeu", value: semResposta, color: "var(--surface-2)" },
  ];

  const resolutionRate = sim + nao > 0 ? (sim / (sim + nao)) * 100 : null;

  return (
    <div className="flex flex-col gap-3">
      {resolutionRate !== null && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Taxa de resolução (entre quem respondeu): <strong style={{ color: "var(--text-primary)" }}>{formatPercent(resolutionRate)}</strong>
        </p>
      )}
      <div className="flex h-8 w-full overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className="h-full"
              style={{ width: `${pct}%`, background: seg.color }}
              title={`${seg.label}: ${formatNumber(seg.value)} (${formatPercent(pct)})`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border" style={{ background: seg.color, borderColor: "var(--border)" }} />
            <span style={{ color: "var(--text-secondary)" }}>{seg.label}</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
              {formatNumber(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
