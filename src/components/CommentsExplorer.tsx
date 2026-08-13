"use client";

import { useMemo, useState } from "react";
import { downloadCsv, responsesToCsv } from "@/lib/export";
import { wordFrequency } from "@/lib/text";
import type { Classification, NpsResponse } from "@/lib/types";
import { ResponseTable } from "./ResponseTable";

type Tab = "all" | Classification;

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: "all", label: "Todos", color: "var(--text-primary)" },
  { key: "detractor", label: "Detratores", color: "var(--status-critical)" },
  { key: "passive", label: "Neutros", color: "var(--status-warning)" },
  { key: "promoter", label: "Promotores", color: "var(--status-good)" },
];

function KeywordBars({ words }: { words: { word: string; count: number }[] }) {
  const max = words[0]?.count ?? 1;
  return (
    <div className="flex flex-col gap-2">
      {words.map((w) => (
        <div key={w.word} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 truncate" style={{ color: "var(--text-secondary)" }}>
            {w.word}
          </span>
          <div className="h-2.5 flex-1 rounded" style={{ background: "var(--surface-2)" }}>
            <div
              className="h-full rounded"
              style={{ width: `${(w.count / max) * 100}%`, background: "var(--series-1)" }}
            />
          </div>
          <span className="w-8 text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
            {w.count}
          </span>
        </div>
      ))}
      {words.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Sem comentários suficientes neste filtro.
        </p>
      )}
    </div>
  );
}

export function CommentsExplorer({ responses }: { responses: NpsResponse[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const withComments = useMemo(() => responses.filter((r) => r.comentario), [responses]);

  const scoped = useMemo(
    () => (tab === "all" ? withComments : withComments.filter((r) => r.classification === tab)),
    [withComments, tab]
  );

  const words = useMemo(
    () => wordFrequency(scoped.map((r) => r.comentario!).filter(Boolean), 12),
    [scoped]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="rounded px-3 py-1 text-sm font-medium transition-colors"
              style={{
                background: tab === t.key ? "var(--surface-2)" : "transparent",
                color: tab === t.key ? t.color : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadCsv("nps_comentarios.csv", responsesToCsv(scoped))}
          className="rounded border px-3 py-1.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Exportar CSV ({scoped.length})
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Palavras mais citadas
        </h3>
        <KeywordBars words={words} />
      </div>

      <ResponseTable responses={scoped} columns={["data", "nota", "equipamento", "comentario", "contato"]} />
    </div>
  );
}
