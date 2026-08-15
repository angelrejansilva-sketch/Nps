"use client";

import type { ChamadoAuditRow } from "@/lib/supabase/chamadosQuery";
import { CHAMADOS_PAGE_SIZE } from "@/lib/supabase/chamadosQuery";
import { formatNumber } from "@/lib/format";
import { Button } from "./Button";

interface ChamadosAuditTableProps {
  rows: ChamadoAuditRow[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export function ChamadosAuditTable({ rows, total, page, onPageChange, loading }: ChamadosAuditTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / CHAMADOS_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              <Th>Chamado</Th>
              <Th>Cliente</Th>
              <Th>Detentor</Th>
              <Th>Encerramento</Th>
              <Th>Série</Th>
              <Th>Material</Th>
              <Th>Segmento</Th>
              <Th>Tipo</Th>
              <Th>SLA</Th>
              <Th>UF</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.chamado} className="border-t" style={{ borderColor: "var(--border)" }}>
                <Td>{r.chamado}</Td>
                <Td>{r.cliente_nome || "—"}</Td>
                <Td>{r.detentor_nome || "—"}</Td>
                <Td muted>{r.encerramento || "—"}</Td>
                <Td muted>{r.serie || "—"}</Td>
                <Td>
                  <span className="line-clamp-2">{r.descricao_material || "—"}</span>
                </Td>
                <Td muted>{r.segmento || "—"}</Td>
                <Td muted>{r.tipo || "—"}</Td>
                <Td>
                  <span
                    style={{
                      color:
                        r.sla_status === "FORA"
                          ? "var(--status-critical)"
                          : r.sla_status === "DENTRO"
                            ? "var(--status-good)"
                            : "var(--text-muted)",
                    }}
                  >
                    {r.sla_status || "—"}
                  </span>
                </Td>
                <Td muted>{r.cliente_uf || "—"}</Td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  Nenhum chamado encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
        <span>
          {loading
            ? "Carregando…"
            : total === 0
              ? "0 chamados"
              : `${page * CHAMADOS_PAGE_SIZE + 1}–${Math.min((page + 1) * CHAMADOS_PAGE_SIZE, total)} de ${formatNumber(total)}`}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0 || loading}>
            Anterior
          </Button>
          <Button
            variant="ghost"
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
      {children}
    </th>
  );
}

function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td className="px-3 py-2 align-top" style={{ color: muted ? "var(--text-secondary)" : "var(--text-primary)" }}>
      {children}
    </td>
  );
}
