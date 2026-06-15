"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
}

/**
 * Barra de pestañas con indicador "pill" neón que se desliza entre tabs
 * (animación compartida vía layoutId). El `groupId` debe ser único por instancia
 * para que dos TabBar distintas no compartan el mismo pill.
 */
export function TabBar({
  tabs,
  active,
  onChange,
  groupId = "tabs",
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  groupId?: string;
  className?: string;
}) {
  return (
    <div className={cn("glass inline-flex flex-wrap gap-1 rounded-2xl p-1", className)}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative rounded-xl px-4 py-2 text-sm font-bold transition-colors",
              isActive ? "text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`tabpill-${groupId}`}
                className="absolute inset-0 -z-0 rounded-xl neon-border"
                style={{ background: "var(--accent-soft)" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
