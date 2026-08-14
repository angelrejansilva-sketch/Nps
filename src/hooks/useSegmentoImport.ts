"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseChamadoSegmentoCsv } from "@/lib/parseSegmento";
import { syncSegmento, upsertChamadoSegmento } from "@/lib/supabase/queries";

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
        const parsed = parseChamadoSegmentoCsv(text);

        if (!parsed.chamadoColumn || !parsed.segmentoColumn) {
          throw new Error(
            "Não encontrei colunas de chamado e segmento nesse arquivo. Verifique se ele tem colunas com esses nomes."
          );
        }

        const supabase = createClient();
        await upsertChamadoSegmento(supabase, parsed.pairs, null, (done, total) =>
          setProgress({ done, total })
        );

        const updated = await syncSegmento(supabase);

        setLastInfo(
          `${fileName}: ${parsed.pairs.length} chamados com segmento importados, ${updated} respostas atualizadas.`
        );
        onSynced();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao importar o mapa de segmento.");
      } finally {
        setImporting(false);
        setProgress(null);
      }
    },
    [onSynced]
  );

  return { importing, progress, error, lastInfo, importCsv };
}
