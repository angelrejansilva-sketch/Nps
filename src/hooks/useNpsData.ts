"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createImportBatch, fetchAllResponses, upsertResponses } from "@/lib/supabase/queries";
import { parseNpsCsv } from "@/lib/parse";
import { summarizeQuality } from "@/lib/metrics";
import type { NpsResponse } from "@/lib/types";

interface ImportProgress {
  done: number;
  total: number;
}

export function useNpsData(userId: string | undefined) {
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [lastImportInfo, setLastImportInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchAllResponses(supabase);
      setResponses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados do Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  const importCsv = useCallback(
    async (fileName: string, text: string) => {
      if (!userId) return;
      setImporting(true);
      setError(null);
      setImportProgress(null);
      try {
        const parsed = parseNpsCsv(text);
        const quality = summarizeQuality(parsed.responses);
        const supabase = createClient();

        const batchId = await createImportBatch(
          supabase,
          {
            fileName,
            totalRows: quality.totalRows,
            validScores: quality.validScores,
            noResponse: quality.noResponse,
            invalidScores: quality.invalidScores,
          },
          userId
        );

        await upsertResponses(supabase, parsed.responses, batchId, (done, total) =>
          setImportProgress({ done, total })
        );

        const missingWarning =
          parsed.missingColumns.length > 0
            ? ` Colunas não encontradas: ${parsed.missingColumns.join(", ")}.`
            : "";
        setLastImportInfo(
          `${fileName}: ${parsed.responses.length} linhas processadas, ${quality.validScores} notas válidas.${missingWarning}`
        );
        await reload();
      } catch (e) {
        setError(
          e instanceof Error
            ? `Falha ao importar: ${e.message}`
            : "Falha ao importar o arquivo. Verifique se você tem permissão (perfil admin ou analista)."
        );
      } finally {
        setImporting(false);
        setImportProgress(null);
      }
    },
    [userId, reload]
  );

  return { responses, loading, error, importing, importProgress, lastImportInfo, importCsv, reload };
}
