import type { NpsResponse } from "./types";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function responsesToCsv(responses: NpsResponse[]): string {
  const headers = [
    "id",
    "data",
    "contato",
    "telefone",
    "chamado",
    "equipamento_categoria",
    "equipamento",
    "nota",
    "classificacao",
    "motivo",
    "problema_solucionado",
    "comentario",
  ];

  const lines = [headers.join(",")];

  for (const r of responses) {
    const date = r.dataChamado ?? r.createdAt;
    lines.push(
      [
        r.id,
        date ? date.toISOString().slice(0, 10) : "",
        r.contactName,
        r.contactPhone,
        r.chamado,
        r.equipmentCategory,
        r.equipmentRaw,
        r.score?.toString() ?? "",
        r.classification ?? "",
        r.motivoNota,
        r.problemaSolucionado,
        r.comentario ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }

  return lines.join("\n");
}

export function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
