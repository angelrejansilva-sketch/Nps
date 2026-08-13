export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizeKey(value: string): string {
  return stripAccents(value).trim().toLowerCase();
}

const STOPWORDS = new Set(
  [
    "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "um", "uma",
    "uns", "umas", "que", "para", "por", "com", "no", "na", "nos", "nas", "ao",
    "aos", "à", "às", "se", "foi", "ser", "muito", "mais", "menos", "meu", "minha",
    "meus", "minhas", "seu", "sua", "seus", "suas", "eu", "voce", "voces", "ele",
    "ela", "eles", "elas", "nao", "sim", "ja", "so", "ate", "sem", "mas", "porque",
    "quando", "como", "esta", "este", "esse", "essa", "isso", "isto", "tem", "ter",
    "foi", "sao", "e", "eh", "pra", "pro", "lo", "la", "me", "te", "nos", "vos",
    "resposta", "respondeu", "comentarios", "comentario", "obrigado", "obrigada",
    "produto", "servico", "positivo",
  ].map(normalizeKey)
);

export function tokenize(text: string): string[] {
  return normalizeKey(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function wordFrequency(texts: string[], limit = 20): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    for (const word of tokenize(text)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
