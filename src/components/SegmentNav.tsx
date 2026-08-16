"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Painel geral" },
  { href: "/varejo", label: "Varejo" },
  { href: "/governo-corporativo", label: "Governo/Corporativo" },
  { href: "/corp-plataforma", label: "Corp Plataforma" },
  { href: "/evolucao-mensal", label: "Evolução Mensal" },
  { href: "/clientes", label: "Por Cliente" },
  { href: "/ct", label: "Por CT" },
  { href: "/chamados", label: "Chamados Encerrados" },
];

export function SegmentNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-full border p-1"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={
              active
                ? { background: "var(--series-1)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
