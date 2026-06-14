"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: any;
  unit?: string;
  color?: "blue" | "red" | "green" | "yellow" | "purple";
  prevText?: string;
}

export function KPICard({ title, value, icon: Icon, unit = "", color = "blue", prevText }: KPICardProps) {
  const colorMap = {
    blue: "text-[var(--accent)]",
    red: "text-rose-400",
    green: "text-emerald-400",
    yellow: "text-amber-400",
    purple: "text-indigo-400"
  };

  const gradientMap = {
    blue: "from-[var(--accent)]/10 to-[var(--accent)]/20",
    red: "from-rose-500/10 to-rose-600/20",
    green: "from-emerald-500/10 to-emerald-600/20",
    yellow: "from-amber-500/10 to-amber-600/20",
    purple: "from-indigo-500/10 to-indigo-600/20"
  };

  return (
    <div className="glass p-6 relative overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 hover:neon-glow">
      <div className={cn("absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl group-hover:scale-110 transition-all duration-500 bg-gradient-to-br opacity-40", gradientMap[color])} />

      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-[var(--text-dim)] text-sm font-bold tracking-wider uppercase mb-2">{title}</h3>
        <p className="text-4xl flex items-baseline gap-2 font-black text-[var(--text)] tracking-tight">
          {value || "0"}
          {unit && value && <span className="text-2xl text-[var(--text-dim)] font-bold">{unit}</span>}
        </p>
        {prevText && (
          <p className="text-xs text-[var(--text-dim)] mt-3 font-medium">{prevText}</p>
        )}
      </div>
    </div>
  );
}
