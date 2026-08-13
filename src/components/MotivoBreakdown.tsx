import { formatNumber, formatPercent } from "@/lib/format";
import type { MotivoPoint } from "@/lib/metrics";

export function MotivoBreakdown({ data }: { data: MotivoPoint[] }) {
  const top = data.filter((d) => d.total >= 5).slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      {top.map((row) => (
        <div key={row.motivo} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span style={{ color: "var(--text-primary)" }}>{row.motivo}</span>
            <span style={{ color: "var(--text-muted)" }}>
              {formatNumber(row.total)} respostas · {formatPercent(row.detractorRate)} detratores
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded" style={{ background: "var(--surface-2)" }}>
            {row.promoters > 0 && (
              <div
                style={{ width: `${(row.promoters / row.total) * 100}%`, background: "var(--status-good)" }}
                title={`Promotores: ${row.promoters}`}
              />
            )}
            {row.passives > 0 && (
              <div
                style={{ width: `${(row.passives / row.total) * 100}%`, background: "var(--status-warning)" }}
                title={`Neutros: ${row.passives}`}
              />
            )}
            {row.detractors > 0 && (
              <div
                style={{ width: `${(row.detractors / row.total) * 100}%`, background: "var(--status-critical)" }}
                title={`Detratores: ${row.detractors}`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
