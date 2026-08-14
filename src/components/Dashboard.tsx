"use client";

import { useMemo, useState } from "react";
import { EMPTY_FILTERS, applyFilters } from "@/lib/filters";
import { downloadCsv, responsesToCsv } from "@/lib/export";
import { formatNps, formatNumber, formatPercent } from "@/lib/format";
import {
  byEquipmentCategory,
  byMotivo,
  monthlyTrend,
  resolutionRate,
  responseRate,
  summarizeNps,
  summarizeQuality,
} from "@/lib/metrics";
import type { Filters } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useNpsData } from "@/hooks/useNpsData";
import { CommentsExplorer } from "./CommentsExplorer";
import { DataQualityPanel } from "./DataQualityPanel";
import { DistributionBar } from "./DistributionBar";
import { EquipmentRanking } from "./EquipmentRanking";
import { FileUpload } from "./FileUpload";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { MotivoBreakdown } from "./MotivoBreakdown";
import { ResponseTable } from "./ResponseTable";
import { SectionCard } from "./SectionCard";
import { NpsTrendChart, VolumeTrendChart } from "./TrendCharts";

export function Dashboard() {
  const { profile, loading: authLoading, signOut, canManageData } = useAuth();
  const {
    responses,
    loading: dataLoading,
    error,
    importing,
    importProgress,
    lastImportInfo,
    importCsv,
  } = useNpsData(profile?.id);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => applyFilters(responses, filters), [responses, filters]);

  const summary = useMemo(() => summarizeNps(filtered), [filtered]);
  const trend = useMemo(() => monthlyTrend(filtered), [filtered]);
  const equipmentRanking = useMemo(() => byEquipmentCategory(filtered), [filtered]);
  const motivoRanking = useMemo(() => byMotivo(filtered), [filtered]);
  const quality = useMemo(() => summarizeQuality(filtered), [filtered]);
  const respRate = useMemo(() => responseRate(filtered), [filtered]);
  const resRate = useMemo(() => resolutionRate(filtered), [filtered]);

  const equipmentOptions = useMemo(() => byEquipmentCategory(responses).map((c) => c.category), [responses]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>
        Carregando…
      </div>
    );
  }

  if (responses.length === 0 && !showImport) {
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Análise de NPS
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {formatNumber(responses.length)} respostas na base
            {profile && ` · ${profile.full_name ?? profile.email}`}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageData && (
            <button
              onClick={() => setShowImport((s) => !s)}
              className="rounded border px-3 py-1.5 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {showImport ? "Fechar importação" : "Atualizar base"}
            </button>
          )}
          <button
            onClick={signOut}
            className="rounded border px-3 py-1.5 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Sair
          </button>
        </div>
      </header>

      {showImport && (
        <SectionCard title="Atualizar base" subtitle="Importa um CSV novo — respostas existentes (mesmo id) são atualizadas">
          <FileUpload onFile={importCsv} />
        </SectionCard>
      )}

      {importing && <ImportOverlay progress={importProgress} />}

      {lastImportInfo && !importing && (
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

      <FilterBar
        filters={filters}
        onChange={setFilters}
        equipmentOptions={equipmentOptions}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="NPS"
          value={formatNps(summary.nps)}
          sublabel={`${formatNumber(summary.validTotal)} respostas válidas`}
          tone={summary.nps === null ? "neutral" : summary.nps < 0 ? "critical" : summary.nps < 50 ? "warning" : "good"}
        />
        <KpiCard label="Taxa de resposta" value={formatPercent(respRate)} sublabel="responderam a nota de recomendação" />
        <KpiCard label="Taxa de resolução" value={formatPercent(resRate)} sublabel="problema resolvido, entre quem respondeu" />
        <KpiCard label="Total no filtro" value={formatNumber(filtered.length)} sublabel={`de ${formatNumber(responses.length)} na base`} />
      </div>

      <SectionCard title="Distribuição" subtitle="Promotores, neutros e detratores no período filtrado">
        <DistributionBar summary={summary} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Evolução do NPS" subtitle="Por mês do chamado">
          <NpsTrendChart data={trend} />
        </SectionCard>
        <SectionCard title="Volume de respostas" subtitle="Por mês do chamado">
          <VolumeTrendChart data={trend} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="NPS por equipamento" subtitle="Top 12 categorias por volume de respostas">
          <EquipmentRanking data={equipmentRanking} />
        </SectionCard>
        <SectionCard
          title="Motivo da nota"
          subtitle="Ordenado pela maior taxa de detratores — onde agir primeiro"
        >
          <MotivoBreakdown data={motivoRanking} />
        </SectionCard>
      </div>

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
          <button
            onClick={() => downloadCsv("nps_respostas.csv", responsesToCsv(filtered))}
            className="rounded border px-3 py-1.5 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Exportar CSV ({filtered.length})
          </button>
        }
      >
        <ResponseTable responses={filtered} />
      </SectionCard>
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
