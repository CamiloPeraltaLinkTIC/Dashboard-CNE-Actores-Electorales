"use client";

import React, { useMemo, useState } from "react";
import { EstrategiaDashboardView } from "@/components/modules/rrss/EstrategiaDashboardView";
import { ListeningDashboardView } from "@/components/modules/rrss/ListeningDashboardView";
import { ContentManagerView } from "./ContentManagerView";
import { DbStatus } from "@/components/ui/DbStatus";
import { cn } from "@/lib/utils";

interface SubTab {
  key: string;
  label: string;
  node: React.ReactNode;
}

interface Section {
  key: string;
  label: string;
  subTabs: SubTab[];
}

/**
 * Módulo unificado de Estrategia Digital / Eventos (CNE).
 * Reutiliza EstrategiaDashboardView / ListeningDashboardView ya portados en rrss
 * (misma DB_ESTRATEGIA, tablas estrategia_digital_metrics / listening_metrics).
 * Content Manager (tabla content_manager_metrics) es nuevo.
 */
export function EventosModule() {
  const sections = useMemo<Section[]>(
    () => [
      {
        key: "elecciones-presidenciales-2026",
        label: "Elecciones Presidenciales 2026",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="elecciones-presidenciales-2026"
                title="Elecciones Presidenciales 2026"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="elecciones-presidenciales-2026-listening"
                title="Análisis de Listening: Elecciones Presidenciales 2026"
              />
            ),
          },
          {
            key: "content-manager",
            label: "Content Manager",
            node: (
              <ContentManagerView
                categoria="elecciones-presidenciales-2026"
                title="Content Manager"
              />
            ),
          },
        ],
      },
      {
        key: "mision-observacion",
        label: "Misión de Observación",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="mision-observacion"
                title="Evento de la Misión de Observación Internacional"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="mision-observacion-listening"
                title="Análisis de Listening: Misión de Observación Internacional"
              />
            ),
          },
        ],
      },
      {
        key: "mujeres-en-la-politica",
        label: "Mujeres en la Política",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="mujeres-en-la-politica"
                title="VIOLENCIA CONTRA LAS MUJERES EN LA POLÍTICA: UN DESAFÍO DE LA DEMOCRACIA"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="mujeres-en-la-politica-listening"
                title="Análisis de Listening: Violencia contra las Mujeres en la Política"
              />
            ),
          },
        ],
      },
      {
        key: "cne",
        label: "Foro Colombia 2026",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="cne"
                title="FORO COLOMBIA 2026: EL MUNDO OBSERVA LEGITIMIDAD Y TRANSPARENCIA PARA LA DEMOCRACIA"
              />
            ),
          },
        ],
      },
      {
        key: "eventos",
        label: "Listening General",
        subTabs: [
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView title="Análisis de Listening" categoria="eventos" />
            ),
          },
        ],
      },
    ],
    []
  );

  const [activeSection, setActiveSection] = useState(sections[0].key);
  const currentSection = sections.find((s) => s.key === activeSection) ?? sections[0];

  const [activeSub, setActiveSub] = useState(currentSection.subTabs[0].key);
  const currentSub =
    currentSection.subTabs.find((t) => t.key === activeSub) ?? currentSection.subTabs[0];

  const handleSection = (key: string) => {
    setActiveSection(key);
    const section = sections.find((s) => s.key === key);
    if (section) setActiveSub(section.subTabs[0].key);
  };

  return (
    <div>
      {/* Cabecera: secciones + estado de conexión */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="glass flex flex-wrap gap-1 rounded-2xl p-1">
          {sections.map((s) => {
            const isActive = s.key === activeSection;
            return (
              <button
                key={s.key}
                onClick={() => handleSection(s.key)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                  isActive
                    ? "text-[var(--text)] neon-border"
                    : "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5"
                )}
                style={isActive ? { background: "var(--accent-soft)" } : undefined}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <DbStatus db="estrategia" />
      </div>

      {/* Sub-pestañas de la sección activa */}
      {currentSection.subTabs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1">
          {currentSection.subTabs.map((t) => {
            const isActive = t.key === activeSub;
            return (
              <button
                key={t.key}
                onClick={() => setActiveSub(t.key)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                  isActive
                    ? "accent-bg text-black neon-glow"
                    : "glass text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {currentSub.node}
    </div>
  );
}
