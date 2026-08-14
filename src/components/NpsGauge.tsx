import { formatNps, formatNumber } from "@/lib/format";
import type { NpsSummary } from "@/lib/metrics";

const ZONES = [
  { from: -100, to: 0, color: "var(--status-critical)" },
  { from: 0, to: 30, color: "var(--status-warning)" },
  { from: 30, to: 70, color: "var(--series-1)" },
  { from: 70, to: 100, color: "var(--status-good)" },
];

const CX = 100;
const CY = 95;
const R = 80;

function angleFor(value: number): number {
  const clamped = Math.max(-100, Math.min(100, value));
  return 180 - ((clamped + 100) / 200) * 180;
}

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function zoneArc(from: number, to: number): string {
  const start = polar(angleFor(from), R);
  const end = polar(angleFor(to), R);
  return `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;
}

export function NpsGauge({ summary }: { summary: NpsSummary }) {
  const value = summary.nps;
  const needleAngle = angleFor(value ?? 0);
  const needleTip = polar(needleAngle, R - 14);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 110" className="w-full max-w-[280px]">
        {ZONES.map((z) => (
          <path
            key={z.color}
            d={zoneArc(z.from, z.to)}
            stroke={z.color}
            strokeWidth={14}
            fill="none"
            strokeLinecap="butt"
          />
        ))}
        {value !== null && (
          <line
            x1={CX}
            y1={CY}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="var(--text-primary)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
        <circle cx={CX} cy={CY} r={5} fill="var(--text-primary)" />
      </svg>
      <div className="-mt-6 flex flex-col items-center">
        <span className="text-3xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {formatNps(value)}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatNumber(summary.validTotal)} respostas válidas
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>Crítico &le;0</span>
        <span>Aperfeiçoamento 1-30</span>
        <span>Qualidade 31-70</span>
        <span>Excelente 71-100</span>
      </div>
    </div>
  );
}
