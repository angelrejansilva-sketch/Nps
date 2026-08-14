import type { AiDataSummary } from "./aiSummary";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamAskAi(
  question: string,
  summary: AiDataSummary,
  history: ChatMessage[],
  onChunk: (fullTextSoFar: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch("/api/ask-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, summary, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erro ${res.status} ao consultar a IA.`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    onChunk(acc);
  }
}
