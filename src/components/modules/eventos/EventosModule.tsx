"use client";

import React, { useMemo, useState } from "react";
import { EstrategiaDashboardView } from "@/components/modules/rrss/EstrategiaDashboardView";
import { ListeningDashboardView } from "@/components/modules/rrss/ListeningDashboardView";
import { ContentManagerView } from "./ContentManagerView";
import { DbStatus } from "@/components/ui/DbStatus";
import { TabBar } from "@/components/ui/TabBar";

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
        key: "foro-de-juventudes",
        label: "Foro de Juventudes",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="foro-de-juventudes"
                title="Foro de Juventudes"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="foro-de-juventudes-listening"
                title="Análisis de Listening: Foro de Juventudes"
              />
            ),
          },
        ],
      },
      {
        key: "democracia-sin-barreras",
        label: "Democracia sin barreras",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="democracia-sin-barreras"
                title="Democracia sin barreras"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="democracia-sin-barreras-listening"
                title="Análisis de Listening: Democracia sin barreras"
              />
            ),
          },
        ],
      },
      {
        key: "moi",
        label: "MOI 2.0",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="moi"
                title="MOI"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="moi-listening"
                title="Análisis de Listening: MOI"
              />
            ),
          },
        ],
      },
      {
        key: "votaciones-segunda-vuelta",
        label: "Presidenciales Segunda Vuelta",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="votaciones-segunda-vuelta"
                title="Presidenciales Segunda Vuelta"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="votaciones-segunda-vuelta-listening"
                title="Análisis de Listening: Presidenciales Segunda Vuelta"
              />
            ),
          },
        ],
      },
      {
        key: "rueda-de-prensa",
        label: "Rueda de Prensa",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="rueda-de-prensa"
                title="Rueda de Prensa"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="rueda-de-prensa-listening"
                title="Análisis de Listening: Rueda de Prensa"
              />
            ),
          },
        ],
      },
      {
        key: "entrega-credencial-presidencial",
        label: "Entrega Credencial Presidencial",
        subTabs: [
          {
            key: "estrategia",
            label: "Estrategia",
            node: (
              <EstrategiaDashboardView
                categoria="entrega-credencial-presidencial"
                title="Entrega Credencial Presidencial"
              />
            ),
          },
          {
            key: "listening",
            label: "Listening",
            node: (
              <ListeningDashboardView
                categoria="entrega-credencial-presidencial-listening"
                title="Análisis de Listening: Entrega Credencial Presidencial"
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

  const defaultSection =
    sections.find((s) => s.key === "entrega-credencial-presidencial")?.key ??
    sections.find((s) => s.key === "rueda-de-prensa")?.key ??
    sections.find((s) => s.key === "votaciones-segunda-vuelta")?.key ??
    sections.find((s) => s.key === "moi")?.key ??
    sections[0].key;
  const [activeSection, setActiveSection] = useState(defaultSection);
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
        <TabBar
          tabs={sections}
          active={activeSection}
          onChange={handleSection}
          groupId="eventos-sections"
        />
        <DbStatus db="estrategia" />
      </div>

      {/* Sub-pestañas de la sección activa */}
      {currentSection.subTabs.length > 1 && (
        <TabBar
          tabs={currentSection.subTabs}
          active={activeSub}
          onChange={setActiveSub}
          groupId="eventos-sub"
          className="mb-6"
        />
      )}

      {currentSub.node}
    </div>
  );
}
