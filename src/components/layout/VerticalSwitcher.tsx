"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { VERTICALS, VERTICAL_IDS, type VerticalId } from "@/lib/verticals";
import { useVertical } from "@/context/VerticalContext";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Selector desplegable CNE / AE.
 * Al cambiar: persiste el vertical, navega al módulo equivalente y re-tematiza
 * toda la interfaz (acento neón) con transición.
 */
export function VerticalSwitcher() {
  const { vertical, config, switchVertical, isSwitching } = useVertical();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // slug del módulo actual: /cne/rrss -> "rrss"
  const currentSlug = pathname?.split("/").filter(Boolean)[1];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = (id: VerticalId) => {
    setOpen(false);
    switchVertical(id, currentSlug);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "glass-strong group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all",
          "hover:neon-border",
          isSwitching && "animate-pulse-glow"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon name={config.icon} className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
            Vertical
          </span>
          <span className="block text-sm font-black neon-text">{config.shortLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--text-dim)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="glass-strong neon-border absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
          role="listbox"
        >
          {VERTICAL_IDS.map((id) => {
            const v = VERTICALS[id];
            const active = id === vertical;
            return (
              <button
                key={id}
                onClick={() => handlePick(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                  active ? "bg-white/5" : "hover:bg-white/5"
                )}
                role="option"
                aria-selected={active}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `rgba(${v.glow}, 0.16)`, color: v.accent }}
                >
                  <Icon name={v.icon} className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1 leading-tight">
                  <span className="block text-sm font-bold text-[var(--text)]">
                    {v.shortLabel}
                  </span>
                  <span className="block text-[11px] text-[var(--text-dim)]">{v.label}</span>
                </span>
                {active && <Check className="h-4 w-4" style={{ color: v.accent }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
