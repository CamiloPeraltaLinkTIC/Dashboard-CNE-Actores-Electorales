"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { useVertical } from "@/context/VerticalContext";
import { modulesFor, type ModuleDef } from "@/lib/verticals";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useLayout();
  const { vertical, config } = useVertical();

  // Agrupa los módulos del vertical activo (+ transversales) por "group".
  const groups = useMemo(() => {
    const mods = modulesFor(vertical);
    const map = new Map<string, ModuleDef[]>();
    for (const m of mods) {
      const g = m.group ?? "General";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return Array.from(map.entries());
  }, [vertical]);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass fixed inset-y-0 left-0 top-16 z-50 flex w-72 flex-col rounded-none border-y-0 border-l-0 transition-transform duration-300 md:relative md:top-0 md:h-full md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 p-4 md:hidden">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--text-dim)]">
            Navegación
          </span>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-[var(--text-dim)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cabecera del vertical activo */}
        <div className="px-4 pt-5 pb-3">
          <Link
            href={`/${vertical}`}
            onClick={() => setSidebarOpen(false)}
            className="glass-strong flex items-center gap-3 rounded-xl p-3 transition-all hover:neon-border"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Icon name={config.icon} className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black neon-text">{config.shortLabel}</span>
              <span className="block text-[11px] text-[var(--text-dim)]">Overview</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 select-none space-y-5 overflow-y-auto px-4 pb-6">
          {groups.map(([group, mods]) => (
            <div key={group} className="space-y-1">
              <p className="px-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
                {group}
              </p>
              {mods.map((m) => {
                const active = pathname === m.path || pathname?.startsWith(m.path + "/");
                return (
                  <Link
                    key={m.path}
                    href={m.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                      active
                        ? "neon-border text-[var(--text)]"
                        : "text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--text)]"
                    )}
                    style={active ? { background: "var(--accent-soft)" } : undefined}
                  >
                    <Icon
                      name={m.icon}
                      className="h-4.5 w-4.5"
                      style={{ color: active ? "var(--accent)" : undefined }}
                    />
                    <span className="flex-1">{m.title}</span>
                    {active && (
                      <span
                        className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <p className="text-[10px] text-[var(--text-faint)]">
            Dashboard Unificado · {config.label}
          </p>
        </div>
      </aside>
    </>
  );
}
