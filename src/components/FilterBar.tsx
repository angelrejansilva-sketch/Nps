"use client";

import type { Filters } from "@/lib/types";

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  equipmentOptions: string[];
  segmentoOptions: string[];
  onReset: () => void;
}

export function FilterBar({ filters, onChange, equipmentOptions, segmentoOptions, onReset }: FilterBarProps) {
  return (
    <div
      className="flex flex-wrap items-end gap-4 rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <Field label="De">
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
          className="rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />
      </Field>

      <Field label="Até">
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
          className="rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />
      </Field>

      <Field label="Equipamento" className="min-w-[200px]">
        <select
          multiple
          value={filters.equipmentCategories}
          onChange={(e) =>
            onChange({
              ...filters,
              equipmentCategories: Array.from(e.target.selectedOptions, (o) => o.value),
            })
          }
          className="h-20 rounded border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        >
          {equipmentOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Segmento" className="min-w-[160px]">
        <select
          multiple
          value={filters.segmentos}
          onChange={(e) =>
            onChange({
              ...filters,
              segmentos: Array.from(e.target.selectedOptions, (o) => o.value),
            })
          }
          className="h-20 rounded border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        >
          {segmentoOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Chamado" className="min-w-[160px]">
        <input
          type="text"
          placeholder="Número do chamado"
          value={filters.chamado}
          onChange={(e) => onChange({ ...filters, chamado: e.target.value })}
          className="w-full rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />
      </Field>

      <Field label="Buscar" className="min-w-[200px] flex-1">
        <input
          type="text"
          placeholder="Cliente ou comentário"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        />
      </Field>

      <button
        onClick={onReset}
        className="rounded border px-3 py-1.5 text-sm font-medium"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        Limpar filtros
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
