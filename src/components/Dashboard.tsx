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
import { parseNpsCsv } from "@/lib/parse";
import type { Filters, ParseResult } from "@/lib/types";
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
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filtered = useMemo(
    () => (result ? applyFilters(result.responses, filters) : []),
    [result, filters]
  );

  const summary = useMemo(() => summarizeNps(filtered), [filtered]);
  const trend = useMemo(() => monthlyTrend(filtered), [filtered]);
  const equipmentRanking = useMemo(() => byEquipmentCategory(filtered), [filtered]);
  const motivoRanking = useMemo(() => byMotivo(filtered), [filtered]);
  const quality = useMemo(() => summarizeQuality(filtered), [filtered]);
  const respRate = useMemo(() => responseRate(filtered), [filtered]);
  const resRate = useMemo(() => resolutionRate(filtered), [filtered]);

  const equipmentOptions = useMemo(
    () => (result ? byEquipmentCategory(result.responses).map((c) => c.category) : []),
    [result]
  );

  if (!result) {
    return (
      <FileUpload
        onFile={(name, text) => {
          setFileName(name);
          setResult(parseNpsCsv(text));
        }}
      />
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
            {fileName} · {formatNumber(result.totalRows)} linhas importadas
          </p>
        </div>
        <button
          onClick={() => {
            setResult(null);
            setFileName(null);
            setFilters(EMPTY_FILTERS);
          }}
          className="rounded border px-3 py-1.5 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Importar outro arquivo
        </button>
      </header>

      {result.missingColumns.length > 0 && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--status-warning)", background: "var(--status-warning-bg)", color: "var(--status-warning)" }}
        >
          Colunas esperadas não encontradas no arquivo: {result.missingColumns.join(", ")}. Algumas
          análises podem ficar incompletas.
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
        <KpiCard label="Total no filtro" value={formatNumber(filtered.length)} sublabel={`de ${formatNumber(result.totalRows)} no arquivo`} />
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
