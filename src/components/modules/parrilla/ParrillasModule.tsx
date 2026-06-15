"use client";

import React, { useMemo, useState } from "react";
import { ParrillaView } from "./ParrillaView";
import { ParrillaGenericaView } from "../parrilla-generica/ParrillaGenericaView";
import { PageHeader } from "@/components/ui/PageHeader";
import { DbStatus } from "@/components/ui/DbStatus";
import { TabBar } from "@/components/ui/TabBar";
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
      <TabBar
        tabs={tabs}
        active={active}
        onChange={setActive}
        groupId={`parrillas-${vertical}`}
        className="mb-6"
      />
      <div key={current.key}>{current.node}</div>
    </div>
  );
}
