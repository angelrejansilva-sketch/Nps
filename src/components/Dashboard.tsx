"use client";

import { useMemo, useState } from "react";
import { applyFilters, defaultFilters } from "@/lib/filters";
import { downloadCsv, responsesToCsv } from "@/lib/export";
import { formatNps, formatNumber, formatPercent } from "@/lib/format";
import {
  averageOf,
  byBarebone,
  byEquipmentCategory,
  byMarca,
  byMotivo,
  bySegmento,
  byTipoEquipamento,
  monthlyTrend,
  resolutionRate,
  responseRate,
  summarizeNps,
  summarizeQuality,
} from "@/lib/metrics";
import { buildAiDataSummary } from "@/lib/aiSummary";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useNpsData } from "@/hooks/useNpsData";
import { useProdutosImport } from "@/hooks/useProdutosImport";
import { useProdutoStats } from "@/hooks/useProdutoStats";
import { useSegmentoImport } from "@/hooks/useSegmentoImport";
import { AiAnalysis } from "./AiAnalysis";
import { Button } from "./Button";
import { CommentsExplorer } from "./CommentsExplorer";
import { DataQualityPanel } from "./DataQualityPanel";
import { DistributionBar } from "./DistributionBar";
import { EquipmentRanking } from "./EquipmentRanking";
import { FileUpload } from "./FileUpload";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { MotivoBreakdown } from "./MotivoBreakdown";
import { ProdutoCatalog } from "./ProdutoCatalog";
import { ProdutosUpload } from "./ProdutosUpload";
import { ResponseTable } from "./ResponseTable";
import { SectionCard } from "./SectionCard";
import { SegmentNav } from "./SegmentNav";
import { SegmentoUpload } from "./SegmentoUpload";
import { Sidebar } from "./Sidebar";
import { NpsTrendChart, VolumeTrendChart } from "./TrendCharts";

export function Dashboard() {
  const { profile, loading: authLoading, signOut, canManageData } = useAuth();
  const {
    responses,
    loading: dataLoading,
    loadProgress,
    error,
    importing,
    importProgress,
    lastImportInfo,
    importCsv,
    reload,
  } = useNpsData(profile?.id);

  const segmentoImport = useSegmentoImport(reload);
  const produtoStats = useProdutoStats();
  const produtosImport = useProdutosImport(profile?.id, produtoStats.reload);

  const [showImport, setShowImport] = useState(false);

  const {
    filters,
    setFilters,
    eligibleResponses,
    yearOptions,
    equipmentOptions,
    segmentoOptions,
    marcaOptions,
    tipoProdutoOptions,
    modeloOptions,
  } = useDashboardFilters(responses);

  // Uma única população (pesquisas enviadas, por data_chamado) — tudo abaixo (válidas,
  // NPS, rankings, tendência) é sempre um subconjunto dela, nunca uma data diferente.
  const filtered = useMemo(() => applyFilters(responses, filters, "chamado"), [responses, filters]);
  const ineligibleCount = useMemo(() => responses.length - eligibleResponses.length, [responses, eligibleResponses]);

  const summary = useMemo(() => summarizeNps(filtered), [filtered]);
  const trend = useMemo(() => monthlyTrend(filtered, "chamado"), [filtered]);
  const equipmentRanking = useMemo(() => byEquipmentCategory(filtered), [filtered]);
  const segmentoRanking = useMemo(() => bySegmento(filtered), [filtered]);
  const marcaRanking = useMemo(() => byMarca(filtered), [filtered]);
  const bareboneRanking = useMemo(() => byBarebone(filtered), [filtered]);
  const tipoEquipamentoRanking = useMemo(() => byTipoEquipamento(filtered), [filtered]);
  const motivoRanking = useMemo(() => byMotivo(filtered), [filtered]);
  const quality = useMemo(() => summarizeQuality(filtered), [filtered]);
  const respRate = useMemo(() => responseRate(filtered), [filtered]);
  const resRate = useMemo(() => resolutionRate(filtered), [filtered]);
  const avgAvaliacao = useMemo(() => averageOf(filtered.map((r) => r.avaliacaoProduto)), [filtered]);
  const avgSatisfacao = useMemo(() => averageOf(filtered.map((r) => r.satisfacaoAtp)), [filtered]);

  const aiSummary = useMemo(() => buildAiDataSummary(filtered, responses.length), [filtered, responses.length]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Carregando…
      </div>
    );
  }

  if (!dataLoading && responses.length === 0 && !showImport) {
    return (
      <div className="flex flex-col gap-4">
        {canManageData ? (
          <FileUpload onFile={importCsv} />
        ) : (
          <div className="mx-auto max-w-md py-24 text-center" style={{ color: "var(--text-secondary)" }}>
            Ainda não há dados de NPS importados. Peça a um admin ou analista para
            importar o arquivo.
          </div>
        )}
        {importing && <ImportOverlay progress={importProgress} />}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentNav />
          {canManageData && (
            <Button variant="primary" onClick={() => setShowImport((s) => !s)}>
              {showImport ? "Fechar importação" : "Atualizar base"}
            </Button>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Análise de NPS
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

      {showImport && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SectionCard title="Atualizar respostas" subtitle="Importa o CSV de NPS — respostas existentes (mesmo id) são atualizadas">
            <FileUpload onFile={importCsv} />
            {lastImportInfo && !importing && (
              <p className="text-sm" style={{ color: "var(--status-good)" }}>
                {lastImportInfo}
              </p>
            )}
          </SectionCard>
          <SectionCard title="Atualizar segmento e produto" subtitle="Liga cada chamado a segmento, marca, modelo (barebone) e SKU">
            <SegmentoUpload
              onFile={segmentoImport.importCsv}
              importing={segmentoImport.importing}
              progress={segmentoImport.progress}
            />
            {segmentoImport.lastInfo && (
              <p className="text-sm" style={{ color: "var(--status-good)" }}>
                {segmentoImport.lastInfo}
              </p>
            )}
            {segmentoImport.error && (
              <p className="text-sm" style={{ color: "var(--status-critical)" }}>
                {segmentoImport.error}
              </p>
            )}
          </SectionCard>
          <SectionCard title="Atualizar catálogo de produtos" subtitle="Categoria, marca e fabricante (base_de_produto)">
            <ProdutosUpload
              onFile={produtosImport.importCsv}
              importing={produtosImport.importing}
              progress={produtosImport.progress}
            />
            {produtosImport.lastInfo && (
              <p className="text-sm" style={{ color: "var(--status-good)" }}>
                {produtosImport.lastInfo}
              </p>
            )}
            {produtosImport.error && (
              <p className="text-sm" style={{ color: "var(--status-critical)" }}>
                {produtosImport.error}
              </p>
            )}
          </SectionCard>
        </div>
      )}

      {importing && <ImportOverlay progress={importProgress} />}

      {lastImportInfo && !importing && !showImport && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--status-good)", background: "var(--status-good-bg)", color: "var(--status-good)" }}
        >
          {lastImportInfo}
        </div>
      )}

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
            { label: "Total no filtro", value: formatNumber(filtered.length) },
            { label: "Respostas válidas", value: formatNumber(summary.validTotal) },
            { label: "Taxa de resposta", value: formatPercent(respRate) },
            { label: "NPS", value: formatNps(summary.nps) },
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
            <KpiCard
              label="NPS"
              value={formatNps(summary.nps)}
              sublabel={`${formatNumber(summary.validTotal)} respostas válidas`}
              tone={summary.nps === null ? "neutral" : summary.nps < 0 ? "critical" : summary.nps < 50 ? "warning" : "good"}
            />
            <KpiCard label="Taxa de resposta" value={formatPercent(respRate)} sublabel="responderam a nota" />
            <KpiCard label="Taxa de resolução" value={formatPercent(resRate)} sublabel="problema resolvido" />
            <KpiCard label="Avaliação do produto" value={avgAvaliacao !== null ? avgAvaliacao.toFixed(1) : "—"} sublabel="média 0-10" />
            <KpiCard label="Satisfação ATP" value={avgSatisfacao !== null ? avgSatisfacao.toFixed(1) : "—"} sublabel="média 1-5" />
            <KpiCard label="Total no filtro" value={formatNumber(filtered.length)} sublabel={`de ${formatNumber(responses.length)} na base`} />
          </div>

          {ineligibleCount > 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatNumber(ineligibleCount)} chamados de fora do escopo do NPS (projeto, segmento ou marca excluídos das regras de elegibilidade) não entram em nenhum número acima.
            </p>
          )}

          <SectionCard title="Distribuição" subtitle="Promotores, neutros e detratores no período filtrado">
            <DistributionBar summary={summary} />
          </SectionCard>

          <SectionCard
            title="Análise por IA"
            subtitle="Pergunte sobre os dados filtrados acima — respostas geradas com base nos números do painel"
          >
            <AiAnalysis summary={aiSummary} />
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Evolução do NPS" subtitle="Por mês do chamado">
              <NpsTrendChart data={trend} />
            </SectionCard>
            <SectionCard title="Volume de respostas" subtitle="Por mês do chamado">
              <VolumeTrendChart data={trend} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SectionCard title="NPS por equipamento" subtitle="Top 12 categorias por volume de respostas">
              <EquipmentRanking data={equipmentRanking} />
            </SectionCard>
            <SectionCard
              title="NPS por segmento"
              subtitle="Varejo / Governo / Corporativo — importe o mapa de chamados para preencher"
            >
              <EquipmentRanking data={segmentoRanking} />
            </SectionCard>
            <SectionCard
              title="Motivo da nota"
              subtitle="Ordenado pela maior taxa de detratores — onde agir primeiro"
            >
              <MotivoBreakdown data={motivoRanking} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="NPS por marca" subtitle="Marca oficial (Chamados Encerrados) — importe o mapa de chamados para preencher">
              <EquipmentRanking data={marcaRanking} />
            </SectionCard>
            <SectionCard
              title="NPS por modelo (barebone)"
              subtitle="Ex: VAIO TL10 — modelo oficial do chamado, top 12 por volume"
            >
              <EquipmentRanking data={bareboneRanking} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="NPS por tipo de equipamento"
              subtitle="Tipo Equipamento do Chamados_Recente — classificação por Barebone, mais granular que a categoria acima"
            >
              <EquipmentRanking data={tipoEquipamentoRanking} />
            </SectionCard>
          </div>

          {produtoStats.stats && produtoStats.stats.total > 0 && (
            <SectionCard
              title="Catálogo de produtos"
              subtitle="Categoria e fabricante oficiais, do cadastro base_de_produto — referência para classificar equipamentos"
            >
              <ProdutoCatalog
                total={produtoStats.stats.total}
                byEquipamento={produtoStats.stats.byEquipamento}
                byFabricante={produtoStats.stats.byFabricante}
              />
            </SectionCard>
          )}

          <SectionCard title="Comentários" subtitle="Palavras mais citadas e respostas com comentário">
            <CommentsExplorer responses={filtered} />
          </SectionCard>

          <SectionCard
            title="Qualidade dos dados"
            subtitle="Transparência sobre o que foi incluído, excluído e por quê"
          >
            <DataQualityPanel quality={quality} />
          </SectionCard>

          <SectionCard
            title="Respostas individuais"
            subtitle="Todas as respostas no filtro atual — use para acompanhar detratores"
            action={
              <Button variant="secondary" onClick={() => downloadCsv("nps_respostas.csv", responsesToCsv(filtered))}>
                Exportar CSV ({filtered.length})
              </Button>
            }
          >
            <ResponseTable responses={filtered} />
          </SectionCard>
        </main>
      </div>
    </div>
  );
}

function ImportOverlay({ progress }: { progress: { done: number; total: number } | null }) {
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;
  return (
    <div
      className="rounded-lg border px-4 py-3 text-sm"
      style={{ borderColor: "var(--series-1)", background: "var(--surface-2)", color: "var(--text-secondary)" }}
    >
      Importando… {progress ? `${formatNumber(progress.done)}/${formatNumber(progress.total)}${pct !== null ? ` (${pct}%)` : ""}` : "processando arquivo"}
    </div>
  );
}
