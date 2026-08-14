import { GOVCORP_SEGMENTOS } from "@/lib/filters";
import { SegmentDashboard } from "@/components/SegmentDashboard";

export default function GovernoCorporativoPage() {
  return (
    <SegmentDashboard
      title="NPS Governo / Corporativo"
      subtitle="Segmentos: GOV, CORP, HASS GOV e HASS CORP"
      segmentGroup={GOVCORP_SEGMENTOS}
      showClienteRanking
    />
  );
}
