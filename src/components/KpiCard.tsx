interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "neutral" | "good" | "warning" | "critical";
}

const TONE_COLOR: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  neutral: "var(--text-primary)",
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

export function KpiCard({ label, value, sublabel, tone = "neutral" }: KpiCardProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border p-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-3xl font-semibold tabular-nums" style={{ color: TONE_COLOR[tone] }}>
        {value}
      </span>
      {sublabel && (
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
