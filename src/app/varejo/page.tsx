import { VAREJO_SEGMENTOS } from "@/lib/filters";
import { SegmentDashboard } from "@/components/SegmentDashboard";

export default function VarejoPage() {
  return (
    <SegmentDashboard
      title="NPS Varejo / CORP Plataforma"
      subtitle="Segmentos: Varejo e CORP Plataforma — use o filtro acima para separar os dois"
      segmentGroup={VAREJO_SEGMENTOS}
      subSegmentOptions={[
        { label: "Varejo", value: "VAREJO" },
        { label: "Corp Plataforma", value: "CORP PLATAFORMA" },
      ]}
    />
  );
}
