"use client";

import { useCallback, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

interface SegmentoUploadProps {
  onFile: (fileName: string, text: string) => void;
  importing: boolean;
  progress: { done: number; total: number } | null;
}

export function SegmentoUpload({ onFile, importing, progress }: SegmentoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Envie um arquivo .csv com colunas de Chamado e Segmento.");
        return;
      }
      try {
        const text = await file.text();
        onFile(file.name, text);
      } catch {
        setError("Não foi possível ler o arquivo.");
      }
    },
    [onFile]
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Exporte a base de Chamados Encerrados para CSV (pode ser a exportação completa — só as
        colunas de Chamado, Segmento, SKU, Marca, Equipamento e Barebone são usadas, o resto é
        descartado no navegador) e importe aqui para ligar cada resposta de NPS ao segmento
        (Varejo / Governo / Corporativo) e ao produto oficial (marca, modelo).
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-6 py-8 text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Clique para escolher o CSV de chamados
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {importing && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Importando…{" "}
          {progress
            ? `${formatNumber(progress.done)}/${formatNumber(progress.total)}`
            : "lendo arquivo"}
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
