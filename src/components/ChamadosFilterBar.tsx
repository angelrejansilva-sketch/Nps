"use client";

import type { ChamadosFilters } from "@/lib/supabase/chamadosQuery";
import { Button } from "./Button";

const SEGMENTO_OPTIONS = ["PI-VAREJO", "PI-GOVERNO", "PI-CORPORA", "TE-GOVERNO", "NÃO DEFINIDO"];
const SLA_OPTIONS = ["DENTRO", "FORA"];
const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface ChamadosFilterBarProps {
  filters: ChamadosFilters;
  onChange: (filters: ChamadosFilters) => void;
  onReset: () => void;
}

export function ChamadosFilterBar({ filters, onChange, onReset }: ChamadosFilterBarProps) {
  const selectStyle = {
    borderColor: "var(--border)",
    background: "var(--surface-1)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="flex flex-wrap items-end gap-4 rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <Field label="Chamado">
        <input
          type="text"
          placeholder="Número do chamado"
          value={filters.chamado}
          onChange={(e) => onChange({ ...filters, chamado: e.target.value })}
          className="w-full rounded border px-2 py-1.5 text-sm"
          style={selectStyle}
        />
      </Field>

      <Field label="Segmento">
        <select
          value={filters.segmento}
          onChange={(e) => onChange({ ...filters, segmento: e.target.value })}
          className="rounded border px-2 py-1.5 text-sm"
          style={selectStyle}
        >
          <option value="">Todos</option>
          {SEGMENTO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="SLA">
        <select
          value={filters.slaStatus}
          onChange={(e) => onChange({ ...filters, slaStatus: e.target.value })}
          className="rounded border px-2 py-1.5 text-sm"
          style={selectStyle}
        >
          <option value="">Todos</option>
          {SLA_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="UF do cliente">
        <select
          value={filters.uf}
          onChange={(e) => onChange({ ...filters, uf: e.target.value })}
          className="rounded border px-2 py-1.5 text-sm"
          style={selectStyle}
        >
          <option value="">Todas</option>
          {UF_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Button variant="ghost" onClick={onReset}>
        Limpar filtros
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
