"use client";

import { useRef, useState } from "react";
import type { AiDataSummary } from "@/lib/aiSummary";
import { streamAskAi } from "@/lib/streamAskAi";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGESTOES = [
  "Quais são os 3 principais motivos de detratores?",
  "Como está o NPS por segmento?",
  "Qual marca/modelo tem pior avaliação?",
  "Resuma as principais reclamações dos comentários",
];

export function AiAnalysis({ summary }: { summary: AiDataSummary }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setError(null);
    setInput("");

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAskAi(
        question,
        summary,
        messages.slice(-12),
        (fullTextSoFar) => {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: fullTextSoFar };
            return copy;
          });
        },
        controller.signal
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Falha ao consultar a IA.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex max-h-[480px] flex-col gap-3 overflow-y-auto rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--surface-2)" : "transparent",
                color: "var(--text-primary)",
                border: m.role === "assistant" ? "1px solid var(--border)" : "none",
              }}
            >
              {m.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre os dados filtrados, ex: por que o NPS caiu em julho?"
          className="flex-1 rounded border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--series-1)", color: "#fff" }}
        >
          {loading ? "Perguntando…" : "Perguntar"}
        </button>
      </form>
    </div>
  );
}
