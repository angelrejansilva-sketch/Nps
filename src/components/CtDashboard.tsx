"use client";

import { useMemo } from "react";
import { applyFilters, defaultFilters } from "@/lib/filters";
import { formatNps, formatNumber } from "@/lib/format";
import { averageOf, ctStats, summarizeNps } from "@/lib/metrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useNpsData } from "@/hooks/useNpsData";
import { Button } from "./Button";
import { CategoryStatTable } from "./CategoryStatTable";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { SectionCard } from "./SectionCard";
import { SegmentNav } from "./SegmentNav";

export function CtDashboard() {
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
  // "resposta": quando a pesquisa foi de fato respondida — NPS, avaliação por CT.
  const filtered = useMemo(() => applyFilters(responses, filters, "chamado"), [responses, filters]);
  const filteredByResposta = useMemo(() => applyFilters(responses, filters, "resposta"), [responses, filters]);

  const summary = useMemo(() => summarizeNps(filteredByResposta), [filteredByResposta]);
  const avgAvaliacao = useMemo(
    () => averageOf(filteredByResposta.map((r) => r.avaliacaoProduto)),
    [filteredByResposta]
  );
  const cts = useMemo(() => ctStats(filteredByResposta), [filteredByResposta]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentNav />
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Análise por CT
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {dataLoading
              ? loadProgress
                ? `Carregando respostas… ${formatNumber(loadProgress.done)}/${formatNumber(loadProgress.total)}`
                : "Carregando respostas…"
              : `${formatNumber(responses.length)} respostas na base`}
            {profile && ` · ${profile.full_name ?? profile.email}`}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Centros de Trabalho" value={formatNumber(cts.length)} sublabel="com resposta no filtro" />
        <KpiCard label="Pesquisas enviadas" value={formatNumber(filtered.length)} sublabel="total no filtro" />
        <KpiCard
          label="NPS geral"
          value={formatNps(summary.nps)}
          tone={summary.nps === null ? "neutral" : summary.nps < 0 ? "critical" : summary.nps < 50 ? "warning" : "good"}
        />
        <KpiCard label="Avaliação do produto" value={avgAvaliacao !== null ? avgAvaliacao.toFixed(1) : "—"} sublabel="média 0-10" />
      </div>

      <SectionCard
        title="Centros de Trabalho"
        subtitle="Clique nas colunas para ordenar — busque por CT para achar um específico"
      >
        <CategoryStatTable
          data={cts}
          categoryLabel="CT"
          searchPlaceholder="Buscar CT…"
          emptyLabel="Nenhum Centro de Trabalho encontrado."
        />
      </SectionCard>
    </div>
  );
}
