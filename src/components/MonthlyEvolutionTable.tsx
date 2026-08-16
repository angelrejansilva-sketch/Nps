import { formatNps, formatNumber, formatPercent } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/metrics";

interface MonthlyEvolutionTableProps {
  data: MonthlyPoint[];
}

export function MonthlyEvolutionTable({ data }: MonthlyEvolutionTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr style={{ background: "var(--surface-2)" }}>
            <Th>Mês</Th>
            <Th>Respostas</Th>
            <Th>Válidas</Th>
            <Th>Taxa de resposta</Th>
            <Th>NPS</Th>
            <Th>Promotores</Th>
            <Th>Neutros</Th>
            <Th>Detratores</Th>
            <Th>Avaliação</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.month} className="border-t" style={{ borderColor: "var(--border)" }}>
              <Td>{m.label}</Td>
              <Td>{formatNumber(m.total)}</Td>
              <Td>{formatNumber(m.validTotal)}</Td>
              <Td>{formatPercent(m.respRate)}</Td>
              <Td>
                <span
                  style={{
                    color:
                      m.nps === null
                        ? "var(--text-muted)"
                        : m.nps < 0
                          ? "var(--status-critical)"
                          : m.nps < 50
                            ? "var(--status-warning)"
                            : "var(--status-good)",
                  }}
                >
                  {formatNps(m.nps)}
                </span>
              </Td>
              <Td>{formatNumber(m.promoters)}</Td>
              <Td>{formatNumber(m.passives)}</Td>
              <Td>{formatNumber(m.detractors)}</Td>
              <Td>{m.avgAvaliacao !== null ? m.avgAvaliacao.toFixed(1) : "—"}</Td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                Nenhuma resposta encontrada no ano selecionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
      {children}
    </td>
  );
}
