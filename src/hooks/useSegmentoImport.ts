"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errorMessage";
import { parseChamadosCsv } from "@/lib/parseChamados";
import { parseChamadoSegmentoCsv } from "@/lib/parseSegmento";
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
        const parsedSegmento = parseChamadoSegmentoCsv(text);
        const parsedChamados = parseChamadosCsv(text);

        if (!parsedSegmento.chamadoColumn) {
          throw new Error("Não encontrei a coluna de Chamado nesse arquivo.");
        }

        const supabase = createClient();

        if (parsedSegmento.pairs.length > 0) {
          await upsertChamadoSegmento(supabase, parsedSegmento.pairs, null);
        }

        if (parsedChamados.records.length > 0) {
          await upsertChamados(supabase, parsedChamados.records, null, (done, total) =>
            setProgress({ done, total })
          );
        }

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
