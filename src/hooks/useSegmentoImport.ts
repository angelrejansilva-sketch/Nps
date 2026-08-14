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

        if (!parsed.chamadoColumn) {
          throw new Error("Não encontrei a coluna de Chamado nesse arquivo.");
        }
        if (parsed.pairs.length === 0) {
          throw new Error(
            "Não encontrei colunas de Segmento, SKU, Marca, Equipamento ou Barebone com dados nesse arquivo."
          );
        }

        const supabase = createClient();
        await upsertChamadoSegmento(supabase, parsed.pairs, null, (done, total) =>
          setProgress({ done, total })
        );

        const updated = await syncSegmento(supabase);

        setLastInfo(
          `${fileName}: ${parsed.pairs.length} chamados importados, ${updated} respostas atualizadas.`
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
