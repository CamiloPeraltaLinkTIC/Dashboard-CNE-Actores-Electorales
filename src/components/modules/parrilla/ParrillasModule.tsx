"use client";

import React, { useMemo, useState } from "react";
import { ParrillaView } from "./ParrillaView";
import { ParrillaGenericaView } from "../parrilla-generica/ParrillaGenericaView";
import { PageHeader } from "@/components/ui/PageHeader";
import { DbStatus } from "@/components/ui/DbStatus";
import { cn } from "@/lib/utils";
import type { VerticalId } from "@/lib/verticals";

interface Tab {
  key: string;
  label: string;
  node: React.ReactNode;
}

/**
 * Módulo de Parrillas de Contenidos. Cada vertical tiene DOS parrillas, en pestañas:
 *  - AE  → Presidenciales (parrilla_presidenciales_ae) + Misión de Observación (parrilla_actores_electorales) · DB analytics
 *  - CNE → Presidenciales (parrilla_elecciones_presidenciales_cne, analytics) + Misión de Observación (dashboard_content, content)
 */
export function ParrillasModule({ vertical }: { vertical: VerticalId }) {
  const tabs = useMemo<Tab[]>(() => {
    if (vertical === "cne") {
      return [
        {
          key: "presidenciales",
          label: "Presidenciales",
          node: (
            <ParrillaView
              table="parrilla_elecciones_presidenciales_cne"
              title="Parrilla Elecciones Presidenciales · CNE"
            />
          ),
        },
        {
          key: "mision",
          label: "Misión de Observación",
          node: (
            <div>
              <PageHeader
                title="Misión de Observación Internacional · CNE"
                description="Parrilla de contenidos del evento de observación"
                icon="LayoutGrid"
                actions={<DbStatus db="content" table="dashboard_content" />}
              />
              <ParrillaGenericaView />
            </div>
          ),
        },
      ];
    }
    return [
      {
        key: "presidenciales",
        label: "Presidenciales",
        node: (
          <ParrillaView
            table="parrilla_presidenciales_ae"
            title="Parrilla Presidenciales · Actores Electorales"
          />
        ),
      },
      {
        key: "mision",
        label: "Misión de Observación",
        node: (
          <ParrillaView
            table="parrilla_actores_electorales"
            title="Misión de Observación Internacional · Actores Electorales"
          />
        ),
      },
    ];
  }, [vertical]);

  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-6 glass flex w-fit flex-wrap gap-1 rounded-2xl p-1">
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
      <div key={current.key}>{current.node}</div>
    </div>
  );
}
