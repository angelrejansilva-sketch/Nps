import { formatNumber } from "@/lib/format";

export interface CountRankingRow {
  category: string;
  value: number;
}

export function CountRanking({ data, color, limit = 12 }: { data: CountRankingRow[]; color: string; limit?: number }) {
  const top = data.slice(0, limit);
  const max = Math.max(...top.map((d) => d.value), 1);

  if (top.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Sem dados suficientes para esse recorte.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {top.map((row) => (
        <div key={row.category} className="grid grid-cols-[minmax(0,180px)_1fr_48px] items-center gap-3 text-sm">
          <span className="truncate" style={{ color: "var(--text-secondary)" }} title={row.category}>
            {row.category}
          </span>
          <div className="h-3 w-full rounded" style={{ background: "var(--surface-2)" }}>
            <div className="h-full rounded" style={{ width: `${(row.value / max) * 100}%`, background: color }} />
          </div>
          <span className="text-right font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
            {formatNumber(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
