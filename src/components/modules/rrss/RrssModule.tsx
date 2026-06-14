"use client";

import React, { useMemo, useState } from "react";
import { EstrategiaDashboardView } from "./EstrategiaDashboardView";
import { ListeningDashboardView } from "./ListeningDashboardView";
import { DbStatus } from "@/components/ui/DbStatus";
import { cn } from "@/lib/utils";
import type { VerticalId } from "@/lib/verticals";

interface Tab {
  key: string;
  label: string;
  node: React.ReactNode;
}

/**
 * Módulo unificado de Redes Sociales.
 * - CNE: categoría `cne_rrss` (Estrategia + Listening).
 * - AE: categorías `actores-electorales` (diario) y `actores-electorales-mensual`.
 * Todo sobre DB_ESTRATEGIA (tablas estrategia_digital_metrics / listening_metrics).
 */
export function RrssModule({ vertical }: { vertical: VerticalId }) {
  const tabs = useMemo<Tab[]>(() => {
    if (vertical === "cne") {
      return [
        {
          key: "estrategia",
          label: "Estrategia",
          node: <EstrategiaDashboardView categoria="cne_rrss" title="Redes Sociales · CNE" />,
        },
        {
          key: "listening",
          label: "Listening",
          node: <ListeningDashboardView categoria="cne_rrss" title="Análisis de Listening · CNE" />,
        },
      ];
    }
    return [
      {
        key: "estrategia-diario",
        label: "Estrategia · Diario",
        node: (
          <EstrategiaDashboardView
            categoria="actores-electorales"
            title="RRSS Actores Electorales · Diario"
          />
        ),
      },
      {
        key: "estrategia-mensual",
        label: "Estrategia · Mensual",
        node: (
          <EstrategiaDashboardView
            categoria="actores-electorales-mensual"
            title="RRSS Actores Electorales · Mensual"
            isMonthly
          />
        ),
      },
      {
        key: "listening-diario",
        label: "Listening · Diario",
        node: (
          <ListeningDashboardView categoria="actores-electorales" title="Listening · Diario" />
        ),
      },
      {
        key: "listening-mensual",
        label: "Listening · Mensual",
        node: (
          <ListeningDashboardView
            categoria="actores-electorales-mensual"
            title="Listening · Mensual"
            isMonthly
          />
        ),
      },
    ];
  }, [vertical]);

  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      {/* Barra de pestañas + estado de conexión */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="glass flex flex-wrap gap-1 rounded-2xl p-1">
          {tabs.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                  isActive
                    ? "text-[var(--text)] neon-border"
                    : "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5"
                )}
                style={isActive ? { background: "var(--accent-soft)" } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <DbStatus db="estrategia" />
      </div>

      {current.node}
    </div>
  );
}
