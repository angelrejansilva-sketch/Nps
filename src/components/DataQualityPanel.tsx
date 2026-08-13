"use client";

import { useState } from "react";
import { formatNumber, formatPercent } from "@/lib/format";
import type { QualitySummary } from "@/lib/metrics";
import { KpiCard } from "./KpiCard";

export function DataQualityPanel({ quality }: { quality: QualitySummary }) {
  const [open, setOpen] = useState(false);
  const problemPct = quality.totalRows
    ? ((quality.invalidScores + quality.invalidDates) / quality.totalRows) * 100
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Linhas no arquivo" value={formatNumber(quality.totalRows)} />
        <KpiCard
          label="Notas válidas (0-10)"
          value={formatNumber(quality.validScores)}
          sublabel={formatPercent((quality.validScores / quality.totalRows) * 100)}
          tone="good"
        />
        <KpiCard
          label="Não respondeu"
          value={formatNumber(quality.noResponse)}
          sublabel={formatPercent((quality.noResponse / quality.totalRows) * 100)}
        />
        <KpiCard
          label="Notas/datas inválidas"
          value={formatNumber(quality.invalidScores + quality.invalidDates)}
          sublabel={formatPercent(problemPct)}
          tone={problemPct > 1 ? "warning" : "neutral"}
        />
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="self-start text-sm font-medium underline"
        style={{ color: "var(--series-1)" }}
      >
        {open ? "Ocultar" : "Ver"} amostra de registros descartados ({quality.issuesBySample.length})
      </button>

      {open && (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th className="px-3 py-2 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                  ID
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                  Campo
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                  Motivo
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                  Valor original
                </th>
              </tr>
            </thead>
            <tbody>
              {quality.issuesBySample.map((issue, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                    {issue.id}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                    {issue.field}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                    {issue.reason}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--status-critical)" }}>
                    {issue.raw || "(vazio)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
