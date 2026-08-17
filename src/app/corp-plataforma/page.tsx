import { SegmentDashboard } from "@/components/SegmentDashboard";

export default function CorpPlataformaPage() {
  return (
    <SegmentDashboard
      title="NPS Corp Plataforma"
      subtitle="Segmento CORP PLATAFORMA — pesquisas enviadas contam pela data de Fechamento Técnico (FT)"
      segmentGroup={["CORP PLATAFORMA"]}
      populationDateRole="ft"
      filterServidorDesktop
    />
  );
}
