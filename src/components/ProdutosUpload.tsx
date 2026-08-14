"use client";

import { useCallback, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

interface ProdutosUploadProps {
  onFile: (fileName: string, text: string) => void;
  importing: boolean;
  progress: { done: number; total: number } | null;
}

export function ProdutosUpload({ onFile, importing, progress }: ProdutosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Envie um arquivo .csv com a coluna codigo_material (export de base_de_produto).");
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
        Exporte o cadastro de produtos (base_de_produto) para CSV e importe aqui — isso alimenta o
        catálogo (categoria, marca, fabricante) usado nas análises de produto.
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-6 py-8 text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Clique para escolher o CSV de produtos
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
