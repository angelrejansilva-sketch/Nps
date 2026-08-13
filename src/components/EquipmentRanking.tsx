import { formatNps, formatNumber } from "@/lib/format";
import type { CategoryPoint } from "@/lib/metrics";

const LOW_SAMPLE_THRESHOLD = 20;

function npsColor(nps: number): string {
  if (nps < 0) return "var(--status-critical)";
  if (nps < 50) return "var(--status-warning)";
  return "var(--status-good)";
}

export function EquipmentRanking({ data }: { data: CategoryPoint[] }) {
  const top = data.slice(0, 12);

  return (
    <div className="flex flex-col gap-3">
      {top.map((row) => {
        const nps = row.nps ?? 0;
        const halfWidth = Math.min(Math.abs(nps), 100) / 2;
        const lowSample = row.validTotal < LOW_SAMPLE_THRESHOLD;

        return (
          <div key={row.category} className="grid grid-cols-[minmax(0,180px)_1fr_64px] items-center gap-3 text-sm">
            <span
              className="truncate"
              style={{ color: "var(--text-secondary)" }}
              title={row.category}
            >
              {row.category}
              {lowSample && (
                <span className="ml-1" style={{ color: "var(--text-muted)" }} title="Amostra pequena (menos de 20 respostas)">
                  *
                </span>
              )}
            </span>
            <div className="relative h-4 w-full" style={{ background: "var(--surface-2)", borderRadius: 4 }}>
              <div
                className="absolute top-0 h-full w-px"
                style={{ left: "50%", background: "var(--border)" }}
              />
              {row.nps !== null && (
                <div
                  className="absolute top-0 h-full rounded-sm"
                  style={{
                    width: `${halfWidth}%`,
                    left: nps >= 0 ? "50%" : `${50 - halfWidth}%`,
                    background: npsColor(nps),
                  }}
                  title={`${row.category}: NPS ${formatNps(row.nps)} · ${formatNumber(row.validTotal)} respostas`}
                />
              )}
            </div>
            <span className="text-right font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
              {formatNps(row.nps)}
            </span>
          </div>
        );
      })}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        * amostra abaixo de {LOW_SAMPLE_THRESHOLD} respostas válidas — leia o NPS com cautela.
      </p>
    </div>
  );
}
