"use client";

import { useMemo, useState } from "react";
import { formatNps, formatNumber } from "@/lib/format";
import type { ClienteStat } from "@/lib/metrics";
import { Button } from "./Button";

const PAGE_SIZE = 25;

type SortKey = "validTotal" | "nps" | "promoters" | "detractors" | "avgAvaliacao";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "validTotal", label: "Respostas" },
  { key: "nps", label: "NPS" },
  { key: "promoters", label: "Promotores" },
  { key: "detractors", label: "Detratores" },
  { key: "avgAvaliacao", label: "Avaliação" },
];

interface ClienteTableProps {
  data: ClienteStat[];
}

export function ClienteTable({ data }: ClienteTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("validTotal");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? data.filter((c) => c.category.toLowerCase().includes(term)) : data;
  }, [data, search]);

  const sorted = useMemo(() => {
    const withNumericNps = filtered.map((c) => ({ ...c, npsSort: c.nps ?? -Infinity }));
    return withNumericNps.sort((a, b) => {
      const key = sortKey === "nps" ? "npsSort" : sortKey;
      const av = a[key] ?? -Infinity;
      const bv = b[key] ?? -Infinity;
      return sortDesc ? bv - av : av - bv;
    });
  }, [filtered, sortKey, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(pageClamped * PAGE_SIZE, pageClamped * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Buscar cliente…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="w-full max-w-xs rounded border px-2 py-1.5 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
      />

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              <Th>Cliente</Th>
              {COLUMNS.map((col) => (
                <Th key={col.key} onClick={() => toggleSort(col.key)} active={sortKey === col.key} desc={sortDesc}>
                  {col.label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.category} className="border-t" style={{ borderColor: "var(--border)" }}>
                <Td>{c.category}</Td>
                <Td>{formatNumber(c.validTotal)}</Td>
                <Td>{formatNps(c.nps)}</Td>
                <Td>{formatNumber(c.promoters)}</Td>
                <Td>{formatNumber(c.detractors)}</Td>
                <Td>{c.avgAvaliacao !== null ? c.avgAvaliacao.toFixed(1) : "—"}</Td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
        <span>
          {sorted.length === 0
            ? "0 clientes"
            : `${pageClamped * PAGE_SIZE + 1}–${Math.min((pageClamped + 1) * PAGE_SIZE, sorted.length)} de ${sorted.length}`}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageClamped === 0}>
            Anterior
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={pageClamped >= totalPages - 1}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  desc,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  desc?: boolean;
}) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium uppercase tracking-wide ${onClick ? "cursor-pointer select-none" : ""}`}
      style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}
    >
      {children}
      {active && (desc ? " ↓" : " ↑")}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
      {children}
    </td>
  );
}
