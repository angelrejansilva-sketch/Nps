"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import type { NpsResponse } from "@/lib/types";

const PAGE_SIZE = 25;

const CLASSIFICATION_LABEL: Record<string, string> = {
  promoter: "Promotor",
  passive: "Neutro",
  detractor: "Detrator",
};

const CLASSIFICATION_COLOR: Record<string, string> = {
  promoter: "var(--status-good)",
  passive: "var(--status-warning)",
  detractor: "var(--status-critical)",
};

interface ResponseTableProps {
  responses: NpsResponse[];
  columns?: Array<"data" | "contato" | "equipamento" | "nota" | "motivo" | "comentario">;
}

export function ResponseTable({
  responses,
  columns = ["data", "contato", "equipamento", "nota", "motivo", "comentario"],
}: ResponseTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(responses.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageRows = useMemo(
    () => responses.slice(pageClamped * PAGE_SIZE, pageClamped * PAGE_SIZE + PAGE_SIZE),
    [responses, pageClamped]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {columns.includes("data") && <Th>Data</Th>}
              {columns.includes("contato") && <Th>Contato</Th>}
              {columns.includes("equipamento") && <Th>Equipamento</Th>}
              {columns.includes("nota") && <Th>Nota</Th>}
              {columns.includes("motivo") && <Th>Motivo</Th>}
              {columns.includes("comentario") && <Th>Comentário</Th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                {columns.includes("data") && (
                  <Td muted>{(r.dataChamado ?? r.createdAt) ? formatDate((r.dataChamado ?? r.createdAt)!) : "—"}</Td>
                )}
                {columns.includes("contato") && (
                  <Td>
                    <div>{r.contactName || "—"}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {r.contactPhone || "—"}
                    </div>
                  </Td>
                )}
                {columns.includes("equipamento") && (
                  <Td>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {r.equipmentCategory}
                    </div>
                    <div>{r.equipmentRaw || "—"}</div>
                  </Td>
                )}
                {columns.includes("nota") && (
                  <Td>
                    {r.score !== null ? (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: r.classification ? CLASSIFICATION_COLOR[r.classification] : undefined,
                        }}
                      >
                        {r.score} · {r.classification ? CLASSIFICATION_LABEL[r.classification] : ""}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </Td>
                )}
                {columns.includes("motivo") && <Td muted>{r.motivoNota}</Td>}
                {columns.includes("comentario") && (
                  <Td>
                    <span className="line-clamp-2">{r.comentario ?? "—"}</span>
                  </Td>
                )}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  Nenhum registro encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
        <span>
          {responses.length === 0
            ? "0 registros"
            : `${pageClamped * PAGE_SIZE + 1}–${Math.min(
                (pageClamped + 1) * PAGE_SIZE,
                responses.length
              )} de ${responses.length}`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={pageClamped === 0}
            className="rounded border px-2 py-1 disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={pageClamped >= totalPages - 1}
            className="rounded border px-2 py-1 disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}
          >
            Próxima
          </button>
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
