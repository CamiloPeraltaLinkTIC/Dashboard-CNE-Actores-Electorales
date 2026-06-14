"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: string;
  delta?: number;
  hint?: string;
}

/** Tarjeta de métrica con acento neón y sparkline opcional. */
export function KPICard({ label, value, icon, delta, hint }: KPICardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <GlassPanel className="relative overflow-hidden group hover:neon-border">
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ background: "var(--accent)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight neon-text">{value}</p>
          {hint && <p className="mt-1 text-xs text-[var(--text-faint)]">{hint}</p>}
        </div>
        {icon && (
          <div
            className="rounded-xl p-2.5"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <Icon name={icon} className="h-5 w-5" />
          </div>
        )}
      </div>
      {typeof delta === "number" && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs font-bold">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5",
              positive ? "text-emerald-300 bg-emerald-400/10" : "text-rose-300 bg-rose-400/10"
            )}
          >
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-[var(--text-faint)]">vs. periodo anterior</span>
        </div>
      )}
    </GlassPanel>
  );
}
