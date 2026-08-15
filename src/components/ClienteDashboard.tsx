"use client";

import { useMemo } from "react";
import { applyFilters, defaultFilters } from "@/lib/filters";
import { formatNps, formatNumber } from "@/lib/format";
import { averageOf, clienteStats, summarizeNps } from "@/lib/metrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useNpsData } from "@/hooks/useNpsData";
import { CategoryStatTable } from "./CategoryStatTable";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { SectionCard } from "./SectionCard";
import { SegmentNav } from "./SegmentNav";
import { Sidebar } from "./Sidebar";

export function ClienteDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth();
  const { responses, loading: dataLoading, loadProgress, error } = useNpsData(profile?.id);

  const {
    filters,
    setFilters,
    yearOptions,
    equipmentOptions,
    segmentoOptions,
    marcaOptions,
    tipoProdutoOptions,
    modeloOptions,
  } = useDashboardFilters(responses);

  // "chamado": população de chamados no período — pesquisas enviadas.
  // "resposta": quando a pesquisa foi de fato respondida — NPS, avaliação por cliente.
  const filtered = useMemo(() => applyFilters(responses, filters, "chamado"), [responses, filters]);
  const filteredByResposta = useMemo(() => applyFilters(responses, filters, "resposta"), [responses, filters]);

  const summary = useMemo(() => summarizeNps(filteredByResposta), [filteredByResposta]);
  const avgAvaliacao = useMemo(
    () => averageOf(filteredByResposta.map((r) => r.avaliacaoProduto)),
    [filteredByResposta]
  );
  const clientes = useMemo(() => clienteStats(filteredByResposta), [filteredByResposta]);

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
            Análise por Cliente
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {dataLoading
              ? loadProgress
                ? `Carregando respostas… ${formatNumber(loadProgress.done)}/${formatNumber(loadProgress.total)}`
                : "Carregando respostas…"
              : `${formatNumber(responses.length)} respostas na base`}
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
          stats={[
            { label: "Clientes", value: formatNumber(clientes.length) },
            { label: "Pesquisas enviadas", value: formatNumber(filtered.length) },
            { label: "NPS geral", value: formatNps(summary.nps) },
            { label: "Avaliação", value: avgAvaliacao !== null ? avgAvaliacao.toFixed(1) : "—" },
          ]}
        >
          <FilterBar
            filters={filters}
            onChange={setFilters}
            yearOptions={yearOptions}
            equipmentOptions={equipmentOptions}
            segmentoOptions={segmentoOptions}
            marcaOptions={marcaOptions}
            tipoProdutoOptions={tipoProdutoOptions}
            modeloOptions={modeloOptions}
            onReset={() => setFilters(defaultFilters())}
          />
        </Sidebar>

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Clientes" value={formatNumber(clientes.length)} sublabel="com resposta no filtro" />
            <KpiCard label="Pesquisas enviadas" value={formatNumber(filtered.length)} sublabel="total no filtro" />
            <KpiCard
              label="NPS geral"
              value={formatNps(summary.nps)}
              tone={summary.nps === null ? "neutral" : summary.nps < 0 ? "critical" : summary.nps < 50 ? "warning" : "good"}
            />
            <KpiCard label="Avaliação do produto" value={avgAvaliacao !== null ? avgAvaliacao.toFixed(1) : "—"} sublabel="média 0-10" />
          </div>

          <SectionCard
            title="Clientes"
            subtitle="Clique nas colunas para ordenar — busque por nome para achar um cliente específico"
          >
            <CategoryStatTable
              data={clientes}
              categoryLabel="Cliente"
              searchPlaceholder="Buscar cliente…"
              emptyLabel="Nenhum cliente encontrado."
            />
          </SectionCard>
        </main>
      </div>
    </div>
  );
}
