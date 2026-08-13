interface CategoryRule {
  category: string;
  pattern: RegExp;
}

const RULES: CategoryRule[] = [
  { category: "Tablet", pattern: /\bTABLET\b|\bTAB\b|POS VISION TAB/i },
  { category: "Notebook VAIO", pattern: /^VAIO\b/i },
  { category: "Notebook Positivo", pattern: /^(NTB|NOTEBOOK)\s*POSITIVO/i },
  { category: "Desktop Master", pattern: /^(POSITIVO|POS)\s*MASTER/i },
  { category: "Desktop/AIO Vision", pattern: /^POSITIVO\s*VISION/i },
  { category: "Smartphone Infinix", pattern: /^INFINIX/i },
  { category: "Celular (Feature Phone)", pattern: /^FEATURE\s*PHONE/i },
  { category: "Terminal", pattern: /^TERMINAL/i },
  { category: "Monitor", pattern: /^MONITOR/i },
  { category: "Impressora", pattern: /^IMPRESSORA/i },
];

export function categorizeEquipment(raw: string): string {
  const value = raw.trim();
  if (!value) return "Não informado";
  for (const rule of RULES) {
    if (rule.pattern.test(value)) return rule.category;
  }
  return "Outros";
}
