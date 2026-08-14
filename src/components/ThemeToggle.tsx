"use client";

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const isDark = current === "dark" || (!current && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

export function ThemeToggle() {
  return (
    <button
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-50 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
      title="Alternar entre tema claro e escuro"
    >
      🌓 Tema
    </button>
  );
}
