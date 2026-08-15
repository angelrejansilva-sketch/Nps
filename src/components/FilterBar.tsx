"use client";

import type { Filters } from "@/lib/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Deriva ano/mês selecionados a partir de dateFrom/dateTo (formato "YYYY-MM"). */
function parseYearMonth(filters: Filters): { year: string; month: string } {
  if (!filters.dateFrom) return { year: "", month: "" };
  const [y, m] = filters.dateFrom.split("-");
  const isWholeYear = filters.dateFrom === `${y}-01` && filters.dateTo === `${y}-12`;
  return { year: y, month: isWholeYear ? "" : m };
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  yearOptions: number[];
  equipmentOptions: string[];
  segmentoOptions: string[];
  marcaOptions: string[];
  tipoProdutoOptions: string[];
  modeloOptions: string[];
  onReset: () => void;
}

export function FilterBar({
  filters,
  onChange,
  yearOptions,
  equipmentOptions,
  segmentoOptions,
  marcaOptions,
  tipoProdutoOptions,
  modeloOptions,
  onReset,
}: FilterBarProps) {
  const { year, month } = parseYearMonth(filters);
  const selectStyle = {
    borderColor: "var(--border)",
    background: "var(--surface-1)",
    color: "var(--text-primary)",
  };

  function handleYearChange(newYear: string) {
    if (!newYear) {
      onChange({ ...filters, dateFrom: null, dateTo: null });
      return;
    }
    onChange({ ...filters, dateFrom: `${newYear}-01`, dateTo: `${newYear}-12` });
  }

  function handleMonthChange(newMonth: string) {
    if (!year) return;
    if (!newMonth) {
      onChange({ ...filters, dateFrom: `${year}-01`, dateTo: `${year}-12` });
      return;
    }
    onChange({ ...filters, dateFrom: `${year}-${newMonth}`, dateTo: `${year}-${newMonth}` });
  }

  return (
    <div
      className="flex flex-wrap items-end gap-4 rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <Field label="Período" className="min-w-[160px]">
        <div className="flex flex-col gap-1">
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
            style={selectStyle}
          >
            <option value="">Todos os anos</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            disabled={!year}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50"
            style={selectStyle}
          >
            <option value="">Todos os meses</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={String(i + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
        </div>
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

      <Field label="Tipo de produto" className="min-w-[180px]">
        <select
          multiple
          value={filters.tiposProduto}
          onChange={(e) =>
            onChange({
              ...filters,
              tiposProduto: Array.from(e.target.selectedOptions, (o) => o.value),
              modelos: [],
            })
          }
          className="h-20 rounded border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        >
          {tipoProdutoOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Modelo" className="min-w-[180px]">
        <select
          multiple
          value={filters.modelos}
          onChange={(e) =>
            onChange({
              ...filters,
              modelos: Array.from(e.target.selectedOptions, (o) => o.value),
            })
          }
          className="h-20 rounded border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        >
          {modeloOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {filters.tiposProduto.length === 0 && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            escolha um tipo pra filtrar
          </span>
        )}
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

      <Field label="Marca" className="min-w-[160px]">
        <select
          multiple
          value={filters.marcas}
          onChange={(e) =>
            onChange({
              ...filters,
              marcas: Array.from(e.target.selectedOptions, (o) => o.value),
            })
          }
          className="h-20 rounded border px-2 py-1 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
        >
          {marcaOptions.map((opt) => (
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
