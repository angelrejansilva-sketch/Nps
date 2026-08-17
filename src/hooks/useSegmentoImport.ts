"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errorMessage";
import { parseChamadosCsv } from "@/lib/parseChamados";
import { syncProdutoValido, syncSegmento, upsertChamados } from "@/lib/supabase/queries";

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
        const parsedChamados = parseChamadosCsv(text);

        if (!parsedChamados.chamadoColumn) {
          throw new Error("Não encontrei a coluna de Chamado nesse arquivo.");
        }

        const supabase = createClient();

        if (parsedChamados.records.length > 0) {
          await upsertChamados(supabase, parsedChamados.records, null, (done) => {
            setProgress({ done, total: parsedChamados.records.length });
          });
        }

        const updated = await syncSegmento(supabase);
        await syncProdutoValido(supabase);

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
