import { formatNumber, formatPercent } from "@/lib/format";
import type { NpsSummary } from "@/lib/metrics";

interface Segment {
  key: "promoters" | "passives" | "detractors";
  label: string;
  color: string;
  bg: string;
}

const SEGMENTS: Segment[] = [
  { key: "promoters", label: "Promotores (9-10)", color: "var(--status-good)", bg: "var(--status-good)" },
  { key: "passives", label: "Neutros (7-8)", color: "var(--status-warning)", bg: "var(--status-warning)" },
  { key: "detractors", label: "Detratores (0-6)", color: "var(--status-critical)", bg: "var(--status-critical)" },
];

export function DistributionBar({ summary }: { summary: NpsSummary }) {
  const total = summary.validTotal || 1;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex h-8 w-full overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--border)" }}
      >
        {SEGMENTS.map((seg) => {
          const value = summary[seg.key];
          const pct = (value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className="group relative h-full transition-opacity hover:opacity-90"
              style={{ width: `${pct}%`, background: seg.bg }}
              title={`${seg.label}: ${formatNumber(value)} (${formatPercent(pct)})`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {SEGMENTS.map((seg) => {
          const value = summary[seg.key];
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={seg.key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: seg.color }}
              />
              <span style={{ color: "var(--text-secondary)" }}>{seg.label}</span>
              <span className="font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
                {formatNumber(value)}
              </span>
              <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                ({formatPercent(pct)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
