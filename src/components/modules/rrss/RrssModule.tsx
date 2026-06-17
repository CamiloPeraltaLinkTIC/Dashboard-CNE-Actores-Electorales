"use client";

import React, { useMemo, useState } from "react";
import { EstrategiaDashboardView } from "./EstrategiaDashboardView";
import { ListeningDashboardView } from "./ListeningDashboardView";
// import { SocialMetricsView } from "./SocialMetricsView"; // Oculto temporalmente
import { DbStatus } from "@/components/ui/DbStatus";
import { TabBar } from "@/components/ui/TabBar";
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
        // Pestaña de métricas por red oculta temporalmente (a la espera de
        // credenciales de las APIs nativas). Para reactivarla: descomentar el
        // import de SocialMetricsView y este bloque.
        // {
        //   key: "hootsuite",
        //   label: "Métricas (redes)",
        //   node: <SocialMetricsView account="cne" />,
        // },
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
        <TabBar tabs={tabs} active={active} onChange={setActive} groupId="rrss" />
        <DbStatus db="estrategia" />
      </div>

      {current.node}
    </div>
  );
}
