"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { createImportBatch, fetchAllResponses, upsertResponses } from "@/lib/supabase/queries";
import { getErrorMessage } from "@/lib/errorMessage";
import { parseNpsCsv } from "@/lib/parse";
import { summarizeQuality } from "@/lib/metrics";
import type { NpsResponse } from "@/lib/types";
import { useAuth } from "./useAuth";

interface ImportProgress {
  done: number;
  total: number;
}

interface NpsDataContextValue {
  responses: NpsResponse[];
  loading: boolean;
  loadProgress: ImportProgress | null;
  error: string | null;
  importing: boolean;
  importProgress: ImportProgress | null;
  lastImportInfo: string | null;
  importCsv: (fileName: string, text: string) => Promise<void>;
  reload: () => Promise<void>;
}

const NpsDataContext = createContext<NpsDataContextValue | null>(null);

/**
 * Busca `nps_responses` inteira uma única vez por sessão de navegação e compartilha
 * via contexto — sem isso, cada página (Dashboard, Varejo, GOV/CORP, CT, Cliente,
 * Evolução Mensal) rebaixava as ~40 mil linhas do zero toda vez que era visitada.
 */
export function NpsDataProvider({ children }: { children: ReactNode }) {
  const { profile, loading: authLoading } = useAuth();
  const userId = profile?.id;

  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [lastImportInfo, setLastImportInfo] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadProgress(null);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchAllResponses(supabase, (done, total) => setLoadProgress({ done, total }));
      setResponses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados do Supabase.");
    } finally {
      setLoading(false);
      setLoadProgress(null);
    }
  }, []);

  useEffect(() => {
    // Só busca depois que a sessão resolver e houver alguém logado — evita disparar
    // a carga pesada na tela de login (que também está sob este provider).
    if (authLoading || !userId || hasLoaded.current) return;
    hasLoaded.current = true;
    reload();
  }, [authLoading, userId, reload]);

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
        const duplicatesWarning =
          parsed.duplicatesRemoved > 0
            ? ` ${parsed.duplicatesRemoved} chamado(s) duplicado(s) no arquivo — mantida só a resposta mais recente de cada.`
            : "";
        setLastImportInfo(
          `${fileName}: ${parsed.responses.length} linhas processadas, ${quality.validScores} notas válidas.${duplicatesWarning}${missingWarning}`
        );
        await reload();
      } catch (e) {
        setError(
          `Falha ao importar: ${getErrorMessage(
            e,
            "erro desconhecido. Verifique se você tem permissão (perfil admin ou analista)."
          )}`
        );
      } finally {
        setImporting(false);
        setImportProgress(null);
      }
    },
    [userId, reload]
  );

  return (
    <NpsDataContext.Provider
      value={{ responses, loading, loadProgress, error, importing, importProgress, lastImportInfo, importCsv, reload }}
    >
      {children}
    </NpsDataContext.Provider>
  );
}

export function useNpsData(): NpsDataContextValue {
  const ctx = useContext(NpsDataContext);
  if (!ctx) throw new Error("useNpsData precisa estar dentro de <NpsDataProvider>.");
  return ctx;
}
