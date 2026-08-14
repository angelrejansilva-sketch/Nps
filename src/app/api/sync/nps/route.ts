import { checkSyncAuth } from "@/lib/syncAuth";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { createImportBatch, upsertResponses } from "@/lib/supabase/queries";
import { parseNpsCsv } from "@/lib/parse";
import { summarizeQuality } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 60;

// Attributed to the admin who owns the automation pipeline — there's no
// logged-in user for a machine-to-machine sync call.
const AUTOMATION_USER_ID = "968692b2-41b8-4742-8fe8-4554103212f2";

export async function POST(req: Request) {
  const authError = checkSyncAuth(req);
  if (authError) return authError;

  let body: { fileName?: string; csv?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("JSON inválido.", { status: 400 });
  }

  if (!body.csv) {
    return new Response("Campo 'csv' ausente.", { status: 400 });
  }

  try {
    const parsed = parseNpsCsv(body.csv);
    const quality = summarizeQuality(parsed.responses);
    const supabase = createServiceRoleClient();

    const batchId = await createImportBatch(
      supabase,
      {
        fileName: body.fileName || "sync-automatico",
        totalRows: quality.totalRows,
        validScores: quality.validScores,
        noResponse: quality.noResponse,
        invalidScores: quality.invalidScores,
      },
      AUTOMATION_USER_ID
    );

    await upsertResponses(supabase, parsed.responses, batchId);

    return Response.json({
      ok: true,
      rowsReceived: parsed.responses.length,
      validScores: quality.validScores,
      missingColumns: parsed.missingColumns,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido.";
    return new Response(`Falha ao sincronizar: ${message}`, { status: 500 });
  }
}
