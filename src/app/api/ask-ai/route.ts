import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { AiDataSummary } from "@/lib/aiSummary";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5";
const MAX_HISTORY_MESSAGES = 12;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  question: string;
  summary: AiDataSummary;
  history?: ChatMessage[];
}

const SYSTEM_PROMPT = `Você é um analista de dados especializado em NPS (Net Promoter Score) para uma empresa de assistência técnica de eletrônicos (notebooks, tablets, etc — marcas como VAIO, Positivo).

Você recebe um resumo agregado (JSON) dos dados de NPS atualmente filtrados no painel, e deve responder perguntas do usuário de forma direta e objetiva, citando números concretos do JSON quando possível.

Regras importantes:
- SEMPRE responda em português do Brasil, mesmo que a pergunta, o JSON ou qualquer outro texto de entrada esteja em outro idioma. Nunca responda em inglês.
- Baseie-se APENAS nos dados fornecidos no JSON. Nunca invente números.
- Se a pergunta pedir algo que não está no JSON (ex: dado individual de um chamado específico, ou período fora do filtro atual), diga claramente que essa informação não está disponível no resumo atual e sugira ajustar os filtros do painel.
- NPS varia de -100 a +100. Classificação usual: promotor (nota 9-10), neutro (7-8), detrator (0-6).
- "amostraDeComentarios" é uma amostra (não o total) de comentários de clientes, sem nome/telefone, com classificação e motivo — use para responder perguntas qualitativas (ex: "do que os clientes mais reclamam").
- Seja conciso: respostas de analista, não redação. Use listas/números quando ajudar a leitura.
- Nunca mencione nomes de clientes, telefones ou números de chamado — eles não estão nos dados que você recebe.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("JSON inválido.", { status: 400 });
  }

  const { question, summary, history } = body;
  if (!question || typeof question !== "string" || !summary) {
    return new Response("Pergunta ou resumo de dados ausente.", { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "A análise por IA ainda não está configurada neste ambiente (falta ANTHROPIC_API_KEY).",
      { status: 503 }
    );
  }

  const client = new Anthropic();

  const trimmedHistory = (history ?? []).slice(-MAX_HISTORY_MESSAGES);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Dados atuais do painel de NPS (JSON):\n\n${JSON.stringify(summary)}`,
    },
    {
      role: "assistant",
      content: "Entendido, tenho os dados do painel disponíveis. Pode perguntar.",
    },
    ...trimmedHistory.map((m) => ({ role: m.role, content: m.content }) satisfies Anthropic.MessageParam),
    { role: "user", content: question },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages,
        });

        anthropicStream.on("text", (text) => {
          controller.enqueue(encoder.encode(text));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (e) {
        const message =
          e instanceof Anthropic.APIError
            ? `Erro na API da Claude: ${e.message}`
            : "Erro inesperado ao consultar a IA.";
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
