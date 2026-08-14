"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber, formatPercent } from "@/lib/format";
import type { ScorePoint } from "@/lib/metrics";

function colorFor(score: number): string {
  if (score <= 6) return "var(--status-critical)";
  if (score <= 8) return "var(--status-warning)";
  return "var(--status-good)";
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ScorePoint }[];
  total: number;
}

function ScoreTooltip({ active, payload, total }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const pct = total > 0 ? (point.total / total) * 100 : 0;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
        Nota {point.score}
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        {formatNumber(point.total)} respostas ({formatPercent(pct)} das válidas)
      </div>
    </div>
  );
}

export function ScoreHistogram({ data }: { data: ScorePoint[] }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="score"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<ScoreTooltip total={total} />} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.score} fill={colorFor(d.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
