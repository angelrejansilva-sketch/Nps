import { VAREJO_SEGMENTOS } from "@/lib/filters";
import { SegmentDashboard } from "@/components/SegmentDashboard";

export default function VarejoPage() {
  return (
    <SegmentDashboard
      title="NPS Varejo / CORP Plataforma"
      subtitle="Segmentos: Varejo e CORP Plataforma"
      segmentGroup={VAREJO_SEGMENTOS}
    />
  );
}
