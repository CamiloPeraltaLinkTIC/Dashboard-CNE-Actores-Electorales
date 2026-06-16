import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "brand" | "emerald" | "amber" | "violet" | "rose" | "slate";
}) {
  const accents: Record<string, { bg: string; text: string }> = {
    brand:   { bg: "rgba(249,115,22,0.12)",  text: "#f97316" },
    emerald: { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
    amber:   { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
    violet:  { bg: "rgba(139,92,246,0.12)",  text: "#8b5cf6" },
    rose:    { bg: "rgba(244,63,94,0.12)",   text: "#f43f5e" },
    slate:   { bg: "rgba(100,116,139,0.12)", text: "#64748b" },
  };

  const a = accents[accent] ?? accents.brand;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">{label}</p>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: a.bg, color: a.text }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight tabular-nums" style={{ color: a.text }}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-faint)]">{hint}</p>}
    </div>
  );
}
