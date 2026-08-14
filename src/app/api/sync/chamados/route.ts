import { checkSyncAuth } from "@/lib/syncAuth";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { chamadoRecordsToInfo, parseChamadosCsv } from "@/lib/parseChamados";
import { syncSegmento, upsertChamadoSegmento, upsertChamados } from "@/lib/supabase/queries";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const authError = checkSyncAuth(req);
  if (authError) return authError;

  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("JSON inválido.", { status: 400 });
  }

  if (!body.csv) {
    return new Response("Campo 'csv' ausente.", { status: 400 });
  }

  try {
    const parsed = parseChamadosCsv(body.csv);
    if (!parsed.chamadoColumn) {
      return new Response("Não encontrei a coluna de Chamado nesse CSV.", { status: 400 });
    }

    const pairs = chamadoRecordsToInfo(parsed.records);
    const supabase = createServiceRoleClient();

    await Promise.all([
      pairs.length > 0 ? upsertChamadoSegmento(supabase, pairs, null) : Promise.resolve(),
      parsed.records.length > 0 ? upsertChamados(supabase, parsed.records, null) : Promise.resolve(),
    ]);

    const updated = await syncSegmento(supabase);

    return Response.json({
      ok: true,
      chamadosRecebidos: parsed.records.length,
      colunasReconhecidas: parsed.matchedColumns.length,
      respostasNpsAtualizadas: updated,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido.";
    return new Response(`Falha ao sincronizar: ${message}`, { status: 500 });
  }
}
