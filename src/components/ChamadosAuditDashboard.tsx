"use client";

import { formatNumber } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useChamadosAudit } from "@/hooks/useChamadosAudit";
import { ChamadosAuditTable } from "./ChamadosAuditTable";
import { ChamadosFilterBar } from "./ChamadosFilterBar";
import { KpiCard } from "./KpiCard";
import { SectionCard } from "./SectionCard";
import { SegmentNav } from "./SegmentNav";
import { Sidebar } from "./Sidebar";

export function ChamadosAuditDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth();
  const { page, setPage, filters, updateFilters, resetFilters, rows, total, loading, error } = useChamadosAudit();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Carregando…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-4">
        <SegmentNav />
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Chamados Encerrados
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Auditoria de todos os chamados importados — não só os que têm resposta de NPS
          </p>
        </div>
      </header>

      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--status-critical)", background: "var(--status-critical-bg)", color: "var(--status-critical)" }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar
          userName={profile?.full_name ?? profile?.email ?? "Usuário"}
          userEmail={profile?.email}
          onSignOut={signOut}
          stats={[{ label: "Chamados no filtro", value: formatNumber(total) }]}
        >
          <ChamadosFilterBar filters={filters} onChange={updateFilters} onReset={resetFilters} />
        </Sidebar>

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <KpiCard label="Chamados no filtro" value={formatNumber(total)} sublabel="total de nps_chamados" />
          </div>

          <SectionCard title="Chamados" subtitle="Todos os chamados encerrados importados, com paginação">
            <ChamadosAuditTable rows={rows} total={total} page={page} onPageChange={setPage} loading={loading} />
          </SectionCard>
        </main>
      </div>
    </div>
  );
}
