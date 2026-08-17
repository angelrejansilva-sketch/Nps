"use client";

import { useMemo } from "react";
import { applyFilters, defaultYearFilters } from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import { monthlyTrend } from "@/lib/metrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useNpsData } from "@/hooks/useNpsData";
import { FilterBar } from "./FilterBar";
import { MonthlyEvolutionTable } from "./MonthlyEvolutionTable";
import { SectionCard } from "./SectionCard";
import { SegmentNav } from "./SegmentNav";
import { Sidebar } from "./Sidebar";
import { NpsTrendChart, VolumeTrendChart } from "./TrendCharts";

export function EvolucaoMensalDashboard() {
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
  } = useDashboardFilters(responses, defaultYearFilters);

  const selectedYear = useMemo(() => {
    if (filters.dateFrom) return Number(filters.dateFrom.split("-")[0]);
    return yearOptions[0] ?? new Date().getFullYear();
  }, [filters.dateFrom, yearOptions]);

  // Mesma população usada nas demais telas (pesquisas enviadas, por data_chamado).
  const filtered = useMemo(() => applyFilters(responses, filters, "chamado"), [responses, filters]);
  const monthly = useMemo(() => monthlyTrend(filtered, "chamado"), [filtered]);

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
            Evolução Mensal
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {dataLoading
              ? loadProgress
                ? `Carregando respostas… ${formatNumber(loadProgress.done)}/${formatNumber(loadProgress.total)}`
                : "Carregando respostas…"
              : `Ano de ${selectedYear} — selecione outro ano no filtro de Período`}
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
            { label: "Ano selecionado", value: String(selectedYear) },
            { label: "Pesquisas no ano", value: formatNumber(filtered.length) },
          ]}
          onResetFilters={() => setFilters(defaultYearFilters())}
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
            onReset={() => setFilters(defaultYearFilters())}
          />
        </Sidebar>

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Evolução do NPS" subtitle={`Mês a mês em ${selectedYear}, por data do chamado`}>
              <NpsTrendChart data={monthly} />
            </SectionCard>
            <SectionCard title="Volume de respostas" subtitle={`Mês a mês em ${selectedYear}`}>
              <VolumeTrendChart data={monthly} />
            </SectionCard>
          </div>

          <SectionCard title="Tabela mensal" subtitle="Todos os meses do ano selecionado, lado a lado">
            <MonthlyEvolutionTable data={monthly} />
          </SectionCard>
        </main>
      </div>
    </div>
  );
}
