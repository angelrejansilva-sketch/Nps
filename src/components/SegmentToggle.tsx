"use client";

export interface SegmentToggleOption {
  label: string;
  value: string | null;
}

interface SegmentToggleProps {
  options: SegmentToggleOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function SegmentToggle({ options, value, onChange }: SegmentToggleProps) {
  return (
    <div
      className="flex flex-wrap gap-1 self-start rounded-full border p-1"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={active ? { background: "var(--series-1)", color: "#ffffff" } : { color: "var(--text-secondary)" }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
