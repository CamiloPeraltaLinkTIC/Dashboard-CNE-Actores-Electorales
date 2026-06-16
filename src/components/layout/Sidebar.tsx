"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { useVertical } from "@/context/VerticalContext";
import { modulesFor, type ModuleDef } from "@/lib/verticals";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useLayout();
  const { vertical, config } = useVertical();
  const [collapsed, setCollapsed] = useState(false);

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
          "glass fixed inset-y-0 left-0 top-16 z-50 flex flex-col rounded-none border-y-0 border-l-0 transition-all duration-300 md:relative md:top-0 md:h-full md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-72"
        )}
      >
        {/* Cabecera móvil */}
        <div className="flex items-center justify-between border-b border-white/5 p-4 md:hidden">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--text-dim)]">
            Navegación
          </span>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-[var(--text-dim)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cabecera del vertical activo */}
        <div className={cn("px-2 pt-5 pb-3", collapsed ? "px-2" : "px-4")}>
          <Link
            href={vertical === "campana" ? "/pauta" : `/${vertical}`}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "glass-strong flex items-center rounded-xl p-3 transition-all hover:neon-border",
              collapsed ? "justify-center" : "gap-3"
            )}
            title={collapsed ? config.shortLabel : undefined}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Icon name={config.icon} className="h-5 w-5" />
            </span>
            {!collapsed && (
              <span className="leading-tight overflow-hidden">
                <span className="block text-sm font-black neon-text">{config.shortLabel}</span>
                <span className="block text-[11px] text-[var(--text-dim)]">Overview</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navegación */}
        <nav className={cn("flex-1 select-none overflow-y-auto pb-6", collapsed ? "px-2 space-y-1" : "px-4 pb-6 space-y-5")}>
          {groups.map(([group, mods]) => (
            <div key={group} className={cn(collapsed ? "space-y-1" : "space-y-1")}>
              {!collapsed && (
                <p className="px-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
                  {group}
                </p>
              )}
              {collapsed && <div className="h-2" />}
              {mods.map((m) => {
                const active = pathname === m.path || pathname?.startsWith(m.path + "/");
                return (
                  <Link
                    key={m.path}
                    href={m.path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? m.title : undefined}
                    className={cn(
                      "group flex items-center rounded-xl text-sm font-semibold transition-all",
                      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                      active
                        ? "neon-border text-[var(--text)]"
                        : "text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--text)]"
                    )}
                    style={active ? { background: "var(--accent-soft)" } : undefined}
                  >
                    <Icon
                      name={m.icon}
                      className="h-4.5 w-4.5 shrink-0"
                      style={{ color: active ? "var(--accent)" : undefined }}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{m.title}</span>
                        {active && (
                          <span
                            className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
                            style={{ background: "var(--accent)" }}
                          />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-white/5 p-4">
            <p className="text-[10px] text-[var(--text-faint)]">
              By LinkTIC · {config.label}
            </p>
          </div>
        )}

        {/* Botón colapsar/expandir — solo visible en desktop */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute -right-3 top-1/2 z-50 hidden -translate-y-1/2 md:flex",
            "h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-[var(--bg-2)] text-[var(--text-dim)] shadow-md transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          )}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>
    </>
  );
}
