"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errorMessage";
import { chamadoRecordsToInfo, parseChamadosCsv } from "@/lib/parseChamados";
import { syncSegmento, upsertChamadoSegmento, upsertChamados } from "@/lib/supabase/queries";

interface Progress {
  done: number;
  total: number;
}

export function useSegmentoImport(onSynced: () => void) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInfo, setLastInfo] = useState<string | null>(null);

  const importCsv = useCallback(
    async (fileName: string, text: string) => {
      setImporting(true);
      setError(null);
      setProgress(null);
      try {
        // Single parse pass covers both the full chamados mirror and the
        // lightweight segmento/marca/modelo lookup — the CSV used to be
        // parsed twice (once per table), doubling the client-side cost.
        const parsedChamados = parseChamadosCsv(text);

        if (!parsedChamados.chamadoColumn) {
          throw new Error("Não encontrei a coluna de Chamado nesse arquivo.");
        }

        const pairs = chamadoRecordsToInfo(parsedChamados.records);
        const supabase = createClient();

        const chamadosDone = { count: 0, total: parsedChamados.records.length };
        const pairsDone = { count: 0, total: pairs.length };
        const reportProgress = () =>
          setProgress({
            done: chamadosDone.count + pairsDone.count,
            total: chamadosDone.total + pairsDone.total,
          });

        await Promise.all([
          pairs.length > 0
            ? upsertChamadoSegmento(supabase, pairs, null, (done) => {
                pairsDone.count = done;
                reportProgress();
              })
            : Promise.resolve(),
          parsedChamados.records.length > 0
            ? upsertChamados(supabase, parsedChamados.records, null, (done) => {
                chamadosDone.count = done;
                reportProgress();
              })
            : Promise.resolve(),
        ]);

        const updated = await syncSegmento(supabase);

        setLastInfo(
          `${fileName}: ${parsedChamados.records.length} chamados importados (${parsedChamados.matchedColumns.length} colunas), ${updated} respostas de NPS atualizadas.`
        );
        onSynced();
      } catch (e) {
        setError(getErrorMessage(e, "Falha ao importar os chamados."));
      } finally {
        setImporting(false);
        setProgress(null);
      }
    },
    [onSynced]
  );

  return { importing, progress, error, lastInfo, importCsv };
}
