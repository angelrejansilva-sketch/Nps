export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function formatPercent(n: number | null, digits = 1): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function formatNps(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  const rounded = Math.round(n);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(d);
}
