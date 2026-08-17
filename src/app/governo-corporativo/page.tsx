import { GOVCORP_SEGMENTOS } from "@/lib/filters";
import { SegmentDashboard } from "@/components/SegmentDashboard";

export default function GovernoCorporativoPage() {
  return (
    <SegmentDashboard
      title="NPS Governo / Corporativo"
      subtitle="Segmentos: GOV, CORP, HASS GOV e HASS CORP — use o filtro acima para separar"
      segmentGroup={GOVCORP_SEGMENTOS}
      populationDateRole="encerramento"
      showClienteRanking
      restrictGovCorpNps
      subSegmentOptions={[
        { label: "GOV", value: "GOV" },
        { label: "CORP", value: "CORP" },
        { label: "HASS GOV", value: "HASS GOV" },
        { label: "HASS CORP", value: "HASS CORP" },
      ]}
    />
  );
}
