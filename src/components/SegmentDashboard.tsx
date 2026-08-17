"use client";

import { useMemo, useState } from "react";
import { clienteEstado } from "@/lib/chamadosRecente";
import { applyFilters, bySegmentoConsolidado, defaultFilters, type DateRole } from "@/lib/filters";
import { formatNps, formatNumber, formatPercent } from "@/lib/format";
import {
  averageOf,
  byCliente,
  byEstado,
  byMotivo,
  byScore,
  govCorpNpsPopulation,
  monthlyTrend,
  responseRate,
  summarizeNps,
  summarizeQuality,
  topByDetractors,
  topByPromoters,
} from "@/lib/metrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
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
import { SegmentNav } from "./SegmentNav";
import { Sidebar } from "./Sidebar";
import { SegmentToggle, type SegmentToggleOption } from "./SegmentToggle";
import { NpsTrendChart } from "./TrendCharts";

interface SegmentDashboardProps {
  title: string;
  subtitle: string;
  segmentGroup: string[];
  showClienteRanking?: boolean;
  /** Data usada para escopar a "população" de chamados no período (Pesquisas enviadas, estado). Padrão: data_chamado. */
  populationDateRole?: DateRole;
  /** Se definido, mostra um toggle pra separar os segmentos dentro do grupo (ex: Varejo vs Corp Plataforma). */
  subSegmentOptions?: SegmentToggleOption[];
  /**
   * NPS TOTAL do Power BI, ramo "somente GOV/CORP": restringe o NPS de serviço
   * (gauge + tendência) a chamados de garantia, com a janela de meses de 2025.
   * VAREJO e a base sem filtro de segmento não têm essa restrição.
   */
  restrictGovCorpNps?: boolean;
}

export function SegmentDashboard({
  title,
  subtitle,
  segmentGroup,
  showClienteRanking,
  populationDateRole = "chamado",
  subSegmentOptions,
  restrictGovCorpNps = false,
}: SegmentDashboardProps) {
  const { profile, loading: authLoading, signOut } = useAuth();
  const { responses, loading: dataLoading, loadProgress, error } = useNpsData(profile?.id);

  const [subSegment, setSubSegment] = useState<string | null>(null);
  // CORP PLATAFORMA sempre usa FT como data de população, mesmo quando acessado
  // via o toggle dentro da página de Varejo, não só pela página dedicada.
  const effectivePopulationDateRole: DateRole = subSegment === "CORP PLATAFORMA" ? "ft" : populationDateRole;

  const scoped = useMemo(
    () => bySegmentoConsolidado(responses, subSegment ? [subSegment] : segmentGroup),
    [responses, subSegment, segmentGroup]
  );

  const {
    filters,
    setFilters,
    eligibleResponses: eligibleScoped,
    yearOptions,
    equipmentOptions,
    segmentoOptions,
    marcaOptions,
    tipoProdutoOptions,
    modeloOptions,
  } = useDashboardFilters(scoped);

  // Uma única população por página (pesquisas enviadas) — data_chamado por padrão,
  // FT (Fechamento Técnico) em CORP PLATAFORMA. Tudo abaixo (válidas, NPS, motivo,
  // avaliação, tendência) é sempre um subconjunto dela, nunca uma data diferente —
  // senão "respostas válidas" pode passar de "pesquisas enviadas".
  const filtered = useMemo(
    () => applyFilters(scoped, filters, effectivePopulationDateRole),
    [scoped, filters, effectivePopulationDateRole]
  );
  const ineligibleCount = useMemo(() => scoped.length - eligibleScoped.length, [scoped, eligibleScoped]);

  // NPS TOTAL do Power BI: no ramo "somente GOV/CORP" o NPS de serviço só considera
  // chamados de garantia (Tipo Encerramento = GARANTIA) e apaga meses sem pesquisa em
  // 2025. Varejo/CORP Plataforma e a base geral usam a população filtrada sem restrição.
  const npsPopulation = useMemo(
    () => (restrictGovCorpNps ? govCorpNpsPopulation(filtered) : filtered),
    [filtered, restrictGovCorpNps]
  );
  const summary = useMemo(() => summarizeNps(npsPopulation), [npsPopulation]);
  const trend = useMemo(
    () => monthlyTrend(npsPopulation, effectivePopulationDateRole),
    [npsPopulation, effectivePopulationDateRole]
  );
  const scoreDist = useMemo(() => byScore(filtered), [filtered]);
  const motivoRanking = useMemo(() => byMotivo(filtered), [filtered]);
  const estadoRanking = useMemo(
    () => byEstado(filtered).map((p) => ({ ...p, category: p.category === "Não classificado" ? p.category : clienteEstado(p.category) })),
    [filtered]
  );
  const quality = useMemo(() => summarizeQuality(filtered), [filtered]);
  const respRate = useMemo(() => responseRate(filtered), [filtered]);
  const avgAvaliacao = useMemo(() => averageOf(filtered.map((r) => r.avaliacaoProduto)), [filtered]);

  const clientePoints = useMemo(
    () => (showClienteRanking ? byCliente(filtered) : []),
    [filtered, showClienteRanking]
  );
  const promotersByCliente = useMemo(
    () => topByPromoters(clientePoints).map((p) => ({ category: p.category, value: p.promoters })),
    [clientePoints]
  );
  const detractorsByCliente = useMemo(
    () => topByDetractors(clientePoints).map((p) => ({ category: p.category, value: p.detractors })),
    [clientePoints]
  );

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
            {title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {dataLoading
              ? loadProgress
                ? `Carregando respostas… ${formatNumber(loadProgress.done)}/${formatNumber(loadProgress.total)}`
                : "Carregando respostas…"
              : `${formatNumber(scoped.length)} respostas no segmento`}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        </div>
        {subSegmentOptions && (
          <SegmentToggle
            options={[{ label: "Todos", value: null }, ...subSegmentOptions]}
            value={subSegment}
            onChange={setSubSegment}
          />
        )}
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
            { label: "Pesquisas enviadas", value: formatNumber(filtered.length) },
            { label: "Respostas válidas", value: formatNumber(summary.validTotal) },
            { label: "Taxa de resposta", value: formatPercent(respRate) },
            { label: "NPS de serviço", value: formatNps(summary.nps) },
          ]}
          onResetFilters={() => setFilters(defaultFilters())}
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
        </main>
      </div>
    </div>
  );
}
