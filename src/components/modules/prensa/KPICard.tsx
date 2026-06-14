"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, CircleDollarSign, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  id: string;
  prevText?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  // Monitoring IDs
  mentions: <Activity className="w-5 h-5 text-[var(--accent)]" />,
  "mentions-month": <Activity className="w-5 h-5 text-[var(--accent)]" />,
  audience: <Users className="w-5 h-5 text-[var(--accent)]" />,
  "audience-month": <Users className="w-5 h-5 text-[var(--accent)]" />,
  sov: <ArrowUpRight className="w-5 h-5 text-[var(--accent)]" />,
  "sov-month": <ArrowUpRight className="w-5 h-5 text-[var(--accent)]" />,
  "ad-value": <CircleDollarSign className="w-5 h-5 text-[var(--accent)]" />,
  "ad-value-month": <CircleDollarSign className="w-5 h-5 text-[var(--accent)]" />
};

export function KPICard({ title, value, change, trend, id, prevText }: KPICardProps) {
  const isPositive = trend === "up";
  const isNeutral = trend === "neutral";

  return (
    <div className="glass p-4 relative overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 hover:neon-glow">
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-all duration-500" style={{ background: "var(--accent-soft)" }} />

      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-dim)]">
          {iconMap[id]}
        </div>
        <div className={cn(
          "flex items-center text-xs font-bold px-2.5 py-1 rounded-full",
          isNeutral ? "bg-white/5 text-[var(--text-dim)] border border-white/10" :
            isPositive ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
        )}>
          {!isNeutral && (isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />)}
          {change}
        </div>
      </div>

      <div>
        <h3 className="text-[var(--text-dim)] text-sm font-semibold mb-1">{title}</h3>
        <p className="text-3xl flex items-baseline gap-2 font-black text-[var(--text)] tracking-tight">
          {value}
        </p>
        {prevText && (
          <p className="text-xs text-[var(--text-faint)] mt-2 font-medium">{prevText}</p>
        )}
      </div>
    </div>
  );
}
