"use client";

import type { CSSProperties } from "react";
import { Button } from "./Button";

interface SidebarStat {
  label: string;
  value: string;
}

interface SidebarProps {
  userName: string;
  userEmail?: string | null;
  onSignOut: () => void;
  stats: SidebarStat[];
  onResetFilters: () => void;
  children: React.ReactNode;
}

/**
 * A sidebar é sempre escura, independente do tema claro/escuro do resto do site —
 * sobrescreve as CSS vars de superfície/texto localmente, então FilterBar/Button
 * dentro dela herdam o visual escuro sem precisar de nenhuma prop especial.
 */
const SIDEBAR_VARS = {
  "--surface-1": "#1c1f24",
  "--surface-2": "#242830",
  "--border": "#343a42",
  "--text-primary": "#f5f5f4",
  "--text-secondary": "#c7c9cc",
  "--text-muted": "#8b8f96",
} as CSSProperties;

export function Sidebar({ userName, userEmail, onSignOut, stats, onResetFilters, children }: SidebarProps) {
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <aside
      className="flex w-full shrink-0 flex-col gap-5 rounded-xl p-4 lg:w-[300px]"
      style={{ ...SIDEBAR_VARS, background: "#14161a" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ background: "var(--series-1)", color: "#ffffff" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {userName}
          </div>
          {userEmail && (
            <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {userEmail}
            </div>
          )}
        </div>
        <button
          onClick={onSignOut}
          className="shrink-0 text-xs underline"
          style={{ color: "var(--text-muted)" }}
        >
          Sair
        </button>
      </div>

      {stats.length > 0 && (
        <div
          className="flex flex-col gap-2 rounded-lg p-3"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Números da pesquisa
          </span>
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-3 text-sm">
              <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
              <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Filtros
          </span>
          <Button variant="ghost" onClick={onResetFilters} className="px-2.5 py-1 text-xs">
            Limpar filtros
          </Button>
        </div>
        {children}
      </div>
    </aside>
  );
}
