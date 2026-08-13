"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNps, formatNumber } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/metrics";

interface TooltipCardPayload {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

interface TooltipCardProps {
  active?: boolean;
  payload?: TooltipCardPayload[];
  label?: string;
}

function TooltipCard({ active, payload, label }: TooltipCardProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}:{" "}
          <span style={{ color: "var(--text-primary)" }}>
            {p.dataKey === "nps" ? formatNps(p.value) : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NpsTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          domain={[-100, 100]}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <ReferenceLine y={0} stroke="var(--text-muted)" />
        <Tooltip content={<TooltipCard />} />
        <Line
          type="monotone"
          dataKey="nps"
          name="NPS"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--series-1)" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function VolumeTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<TooltipCard />} />
        <Bar dataKey="validTotal" name="Respostas válidas" fill="var(--series-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
