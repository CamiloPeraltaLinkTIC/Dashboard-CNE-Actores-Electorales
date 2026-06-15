"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number; // percentage change
  colorClass?: string;
  valuePrefix?: string;
  valueSuffix?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorClass = "text-[var(--accent)]",
  valuePrefix = "",
  valueSuffix
}: KPICardProps) {
  return (
    <div className="glass p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-2xl bg-white/5 border border-white/10", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-dim)]">{title}</h3>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-[var(--text)]">
          {valuePrefix}
          <AnimatedNumber value={value} format={(n) => n.toLocaleString("es-CO")} />
          {valueSuffix}
        </span>
        {trend !== undefined && trend !== 0 && (
          <span className={cn(
            "p-1 rounded-full flex items-center justify-center shrink-0",
            trend > 0
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          )}>
            {trend > 0 ? (
              <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs font-medium text-[var(--text-dim)] mt-2">{subtitle}</p>
      )}
    </div>
  );
}
