"use client";

import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
  onFile: (fileName: string, text: string) => void;
}

export function FileUpload({ onFile }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Envie um arquivo .csv (exporte a planilha para CSV antes de importar).");
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
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Análise de NPS
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Importe o CSV de respostas do NPS para ver o painel completo. O arquivo é
        processado inteiramente no seu navegador — nada é enviado para nenhum
        servidor.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-8 py-12 transition-colors"
        style={{
          borderColor: dragOver ? "var(--series-1)" : "var(--border)",
          background: dragOver ? "var(--surface-2)" : "var(--surface-1)",
        }}
      >
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          Arraste o arquivo aqui ou clique para escolher
        </span>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Formato esperado: CSV com colunas do export de NPS (recomendar_servico,
          data_do_chamado, tipo_equipamento, etc.)
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

      {error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
