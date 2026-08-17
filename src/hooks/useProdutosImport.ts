"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errorMessage";
import { parseProdutosCsv } from "@/lib/parseProdutos";
import { createImportBatch, syncProdutoValido, upsertProdutos } from "@/lib/supabase/queries";

interface Progress {
  done: number;
  total: number;
}

export function useProdutosImport(userId: string | undefined, onImported: () => void) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInfo, setLastInfo] = useState<string | null>(null);

  const importCsv = useCallback(
    async (fileName: string, text: string) => {
      if (!userId) return;
      setImporting(true);
      setError(null);
      setProgress(null);
      try {
        const parsed = parseProdutosCsv(text);

        if (!parsed.codigoColumn) {
          throw new Error(
            "Não encontrei a coluna codigo_material nesse arquivo. Verifique se é o export de base_de_produto."
          );
        }

        const supabase = createClient();
        const batchId = await createImportBatch(
          supabase,
          { fileName, totalRows: parsed.totalRows, validScores: 0, noResponse: 0, invalidScores: 0 },
          userId
        );

        await upsertProdutos(supabase, parsed.produtos, batchId, (done, total) =>
          setProgress({ done, total })
        );
        await syncProdutoValido(supabase);

        setLastInfo(`${fileName}: ${parsed.produtos.length} produtos importados.`);
        onImported();
      } catch (e) {
        setError(getErrorMessage(e, "Falha ao importar a tabela de produtos."));
      } finally {
        setImporting(false);
        setProgress(null);
      }
    },
    [userId, onImported]
  );

  return { importing, progress, error, lastInfo, importCsv };
}
