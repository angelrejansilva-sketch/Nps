"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { applyFilters, bySegmentoConsolidado, defaultFilters, isElegivelNps } from "@/lib/filters";
import { formatNps, formatNumber, formatPercent } from "@/lib/format";
import {
  averageOf,
  availableYears,
  byBarebone,
  byCliente,
  byEquipamentoOficial,
  byEquipmentCategory,
  byEstado,
  byMarca,
  byMotivo,
  byScore,
  groupBySegmentoConsolidado,
  monthlyTrend,
  optionLabels,
  responseRate,
  summarizeNps,
  summarizeQuality,
  topByDetractors,
  topByPromoters,
} from "@/lib/metrics";
import type { Filters } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useNpsData } from "@/hooks/useNpsData";
import { CommentsExplorer } from "./CommentsExplorer";
import { CountRanking } from "./CountRanking";
import { EquipmentRanking } from "./EquipmentRanking";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { MotivoBreakdown } from "./MotivoBreakdown";
import { NpsGauge } from "./NpsGauge";
import { ResolutionBar } from "./ResolutionBar";
import { ScoreHistogram } from "./ScoreHistogram";
import { SectionCard } from "./SectionCard";
import { NpsTrendChart } from "./TrendCharts";

interface SegmentDashboardProps {
  title: string;
  subtitle: string;
  segmentGroup: string[];
  showClienteRanking?: boolean;
}

export function SegmentDashboard({ title, subtitle, segmentGroup, showClienteRanking }: SegmentDashboardProps) {
  const { profile, loading: authLoading, signOut } = useAuth();
  const { responses, loading: dataLoading, loadProgress, error } = useNpsData(profile?.id);

  const [filters, setFilters] = useState<Filters>(() => defaultFilters());

  const scoped = useMemo(() => bySegmentoConsolidado(responses, segmentGroup), [responses, segmentGroup]);
  const filtered = useMemo(() => applyFilters(scoped, filters), [scoped, filters]);
  const eligibleScoped = useMemo(() => scoped.filter(isElegivelNps), [scoped]);
  const ineligibleCount = useMemo(() => scoped.length - eligibleScoped.length, [scoped, eligibleScoped]);

  const summary = useMemo(() => summarizeNps(filtered), [filtered]);
  const trend = useMemo(() => monthlyTrend(filtered), [filtered]);
  const scoreDist = useMemo(() => byScore(filtered), [filtered]);
  const motivoRanking = useMemo(() => byMotivo(filtered), [filtered]);
  const estadoRanking = useMemo(() => byEstado(filtered), [filtered]);
  const quality = useMemo(() => summarizeQuality(filtered), [filtered]);
  const respRate = useMemo(() => responseRate(filtered), [filtered]);
  const avgAvaliacao = useMemo(() => averageOf(filtered.map((r) => r.avaliacaoProduto)), [filtered]);

  const clientePoints = useMemo(() => (showClienteRanking ? byCliente(filtered) : []), [filtered, showClienteRanking]);
  const promotersByCliente = useMemo(
    () => topByPromoters(clientePoints).map((p) => ({ category: p.category, value: p.promoters })),
    [clientePoints]
  );
  const detractorsByCliente = useMemo(
    () => topByDetractors(clientePoints).map((p) => ({ category: p.category, value: p.detractors })),
    [clientePoints]
  );

  const yearOptions = useMemo(() => availableYears(scoped), [scoped]);
  const equipmentOptions = useMemo(() => optionLabels(byEquipmentCategory(eligibleScoped)), [eligibleScoped]);
  const segmentoOptions = useMemo(
    () => optionLabels(groupBySegmentoConsolidado(eligibleScoped)),
    [eligibleScoped]
  );
  const marcaOptions = useMemo(() => byMarca(scoped).map((c) => c.category), [scoped]);
  const tipoProdutoOptions = useMemo(
    () => optionLabels(byEquipamentoOficial(eligibleScoped)),
    [eligibleScoped]
  );
  const modeloOptions = useMemo(() => {
    const filteredByTipo =
      filters.tiposProduto.length > 0
        ? eligibleScoped.filter((r) => filters.tiposProduto.includes(r.equipamentoOficial ?? "Não classificado"))
        : eligibleScoped;
    return optionLabels(byBarebone(filteredByTipo));
  }, [eligibleScoped, filters.tiposProduto]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Carregando…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <Link href="/" className="underline">
              Painel geral
            </Link>
            <span>·</span>
            <Link href="/varejo" className="underline">
              Varejo
            </Link>
            <span>·</span>
            <Link href="/governo-corporativo" className="underline">
              Governo/Corporativo
            </Link>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {dataLoading
              ? loadProgress
                ? `Carregando respostas… ${formatNumber(loadProgress.done)}/${formatNumber(loadProgress.total)}`
                : "Carregando respostas…"
              : `${formatNumber(scoped.length)} respostas no segmento`}
            {profile && ` · ${profile.full_name ?? profile.email}`}
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded border px-3 py-1.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Sair
        </button>
      </header>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {subtitle}
      </p>

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Pesquisas enviadas" value={formatNumber(filtered.length)} sublabel="total no filtro" />
        <KpiCard label="Respostas válidas" value={formatNumber(summary.validTotal)} sublabel="nota de 0 a 10" />
        <KpiCard label="Taxa de resposta" value={formatPercent(respRate)} sublabel="responderam a nota" />
        <KpiCard label="Não respondidos" value={formatNumber(quality.noResponse)} sublabel="sem nota" />
        <KpiCard
          label="NPS de serviço"
          value={formatNps(summary.nps)}
          tone={summary.nps === null ? "neutral" : summary.nps < 0 ? "critical" : summary.nps < 50 ? "warning" : "good"}
        />
        <KpiCard label="Avaliação do produto" value={avgAvaliacao !== null ? avgAvaliacao.toFixed(1) : "—"} sublabel="média 0-10" />
      </div>

      {ineligibleCount > 0 && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatNumber(ineligibleCount)} chamados de fora do escopo do NPS (projeto, segmento ou marca excluídos das regras de elegibilidade) não entram em nenhum número acima.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="NPS de serviço" subtitle="Faixas: crítico, aperfeiçoamento, qualidade, excelente">
          <NpsGauge summary={summary} />
        </SectionCard>
        <SectionCard title="NPS por mês" subtitle="Evolução mensal">
          <NpsTrendChart data={trend} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Distribuição das notas 0-10" subtitle="Somente respostas válidas">
          <ScoreHistogram data={scoreDist} />
        </SectionCard>
        <SectionCard title="Problema solucionado" subtitle="Chamados distintos por resposta">
          <ResolutionBar responses={filtered} />
        </SectionCard>
      </div>

      {showClienteRanking && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Promotores por cliente" subtitle="Top 12, maior volume primeiro">
            <CountRanking data={promotersByCliente} color="var(--status-good)" />
          </SectionCard>
          <SectionCard title="Detratores por cliente" subtitle="Top 12, maior volume primeiro">
            <CountRanking data={detractorsByCliente} color="var(--status-critical)" />
          </SectionCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Motivo da nota" subtitle="Ordenado pela maior taxa de detratores">
          <MotivoBreakdown data={motivoRanking} />
        </SectionCard>
        <SectionCard title="NPS por estado" subtitle="UF do cliente — precisa do CSV de Chamados Encerrados importado">
          <EquipmentRanking data={estadoRanking} />
        </SectionCard>
      </div>

      <SectionCard title="Comentários" subtitle="Palavras mais citadas e respostas com comentário">
        <CommentsExplorer responses={filtered} />
      </SectionCard>
    </div>
  );
}
