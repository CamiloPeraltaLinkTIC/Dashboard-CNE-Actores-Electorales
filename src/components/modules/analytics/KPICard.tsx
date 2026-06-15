"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Users, Activity, MousePointerClick, Clock, UserPlus, Eye, Contact } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  id: string;
  prevText?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  users: <Users className="w-5 h-5 text-[var(--accent)]" />,
  totalUsers: <Contact className="w-5 h-5 text-[var(--accent)]" />,
  activeUsers: <Users className="w-5 h-5 text-[var(--accent)]" />,
  newUsers: <UserPlus className="w-5 h-5 text-[var(--accent)]" />,
  views: <Eye className="w-5 h-5 text-[var(--accent)]" />,
  sessions: <Activity className="w-5 h-5 text-[var(--accent)]" />,
  bounce: <MousePointerClick className="w-5 h-5 text-rose-400" />,
  duration: <Clock className="w-5 h-5 text-amber-300" />
};

export function KPICard({ title, value, change, trend, id, prevText }: KPICardProps) {
  const isPositive = trend === "up";
  const isNeutral = trend === "neutral";

  return (
    <div className="glass p-4 relative overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 hover:neon-glow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-dim)]">
          {iconMap[id]}
        </div>
        <div className={cn(
          "flex items-center text-xs font-bold px-2.5 py-1 rounded-full",
          isNeutral ? "bg-white/5 text-[var(--text-dim)]" :
            isPositive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-400",
          id === "bounce" && isPositive ? "text-rose-400 bg-rose-500/10" : "",
          id === "bounce" && !isPositive && !isNeutral ? "text-emerald-300 bg-emerald-500/10" : ""
        )}>
          {!isNeutral && (isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />)}
          {change}
        </div>
      </div>

      <div>
        <h3 className="text-[var(--text-dim)] text-sm font-semibold mb-1">{title}</h3>
        <p className="text-3xl flex items-baseline gap-2 font-black text-[var(--text)] tracking-tight">
          <AnimatedNumber
            value={value}
            format={(n) =>
              `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })}${/%$/.test(value) ? "%" : ""}`
            }
          />
        </p>
        {prevText && (
          <p className="text-xs text-[var(--text-faint)] mt-2 font-medium">{prevText}</p>
        )}
      </div>
    </div>
  );
}
