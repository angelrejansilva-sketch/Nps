import { formatNumber } from "@/lib/format";

interface Item {
  label: string;
  total: number;
}

function BarList({ items }: { items: Item[] }) {
  const max = items[0]?.total ?? 1;
  return (
    <div className="flex flex-col gap-2">
      {items.slice(0, 10).map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <span className="w-32 shrink-0 truncate" style={{ color: "var(--text-secondary)" }} title={item.label}>
            {item.label}
          </span>
          <div className="h-2.5 flex-1 rounded" style={{ background: "var(--surface-2)" }}>
            <div
              className="h-full rounded"
              style={{ width: `${(item.total / max) * 100}%`, background: "var(--series-1)" }}
            />
          </div>
          <span className="w-12 text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
            {formatNumber(item.total)}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhum produto importado ainda.
        </p>
      )}
    </div>
  );
}

export function ProdutoCatalog({
  total,
  byEquipamento,
  byFabricante,
}: {
  total: number;
  byEquipamento: { equipamento: string; total: number }[];
  byFabricante: { fabricante: string; total: number }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {formatNumber(total)} produtos no catálogo (base_de_produto).
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Por categoria de equipamento
          </h3>
          <BarList items={byEquipamento.map((e) => ({ label: e.equipamento, total: e.total }))} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Por fabricante
          </h3>
          <BarList items={byFabricante.map((f) => ({ label: f.fabricante, total: f.total }))} />
        </div>
      </div>
    </div>
  );
}
