import type { DbName } from "./supabase/clients";

/**
 * Configuración declarativa de VERTICALES.
 *
 * Un solo origen de verdad que alimenta:
 *  - el menú lateral (Sidebar)
 *  - el selector desplegable CNE / AE (VerticalSwitcher)
 *  - el tema de color (acento neón por vertical)
 *  - qué base de datos usa cada módulo (registry)
 *  - el cruce entre verticales (mismo `slug` -> salto equivalente)
 */

export type VerticalId = "cne" | "ae";

export interface ModuleDef {
  /** Identificador estable; si dos verticales comparten slug, el switcher salta al equivalente. */
  slug: string;
  title: string;
  description: string;
  /** Ruta absoluta del módulo dentro de la app unificada. */
  path: string;
  /** Base de datos del registry a la que se conecta el módulo. */
  db: DbName;
  /** Nombre del icono de lucide-react (resuelto en el Sidebar). */
  icon: string;
  /** Agrupador opcional dentro del Sidebar. */
  group?: string;
}

export interface VerticalDef {
  id: VerticalId;
  label: string;
  shortLabel: string;
  description: string;
  /** Color de acento (neón) del vertical. */
  accent: string;
  accentSoft: string;
  glow: string;
  icon: string;
  modules: ModuleDef[];
}

export const VERTICALS: Record<VerticalId, VerticalDef> = {
  cne: {
    id: "cne",
    label: "Consejo Nacional Electoral",
    shortLabel: "CNE",
    description: "Monitoreo institucional y electoral del CNE",
    accent: "#22d3ee",
    accentSoft: "rgba(34, 211, 238, 0.14)",
    glow: "34, 211, 238",
    icon: "Landmark",
    modules: [
      {
        slug: "rrss",
        title: "Redes Sociales",
        description: "Estrategia y listening en redes sociales del CNE",
        path: "/cne/rrss",
        db: "estrategia",
        icon: "Radio",
        group: "Monitoreo",
      },
      {
        slug: "parrilla",
        title: "Parrillas",
        description: "Parrillas de contenidos: Presidenciales y Misión de Observación",
        path: "/cne/parrilla",
        db: "analytics",
        icon: "LayoutGrid",
        group: "Electoral",
      },
      {
        slug: "eventos",
        title: "Estrategia Digital",
        description: "Eventos, misión de observación y agenda digital",
        path: "/cne/eventos",
        db: "estrategia",
        icon: "CalendarRange",
        group: "Electoral",
      },
    ],
  },
  ae: {
    id: "ae",
    label: "Actores Electorales",
    shortLabel: "AE",
    description: "Inteligencia digital de los actores electorales",
    accent: "#e879f9",
    accentSoft: "rgba(232, 121, 249, 0.14)",
    glow: "232, 121, 249",
    icon: "Users",
    modules: [
      {
        slug: "analytics",
        title: "Analytics GA4",
        description: "Tráfico web y comportamiento (Google Analytics 4)",
        path: "/ae/analytics",
        db: "analytics",
        icon: "BarChart3",
        group: "Web",
      },
      {
        slug: "rrss",
        title: "Redes Sociales",
        description: "Estrategia y listening en redes sociales",
        path: "/ae/rrss",
        db: "estrategia",
        icon: "Radio",
        group: "Monitoreo",
      },
      {
        slug: "parrilla",
        title: "Parrillas",
        description: "Parrillas de contenidos: Presidenciales y Misión de Observación",
        path: "/ae/parrilla",
        db: "analytics",
        icon: "LayoutGrid",
        group: "Contenido",
      },
    ],
  },
};

/** Módulos transversales: aparecen en ambos verticales. */
export const SHARED_MODULES: ModuleDef[] = [
  {
    slug: "prensa",
    title: "Análisis de Prensa",
    description: "Monitoreo de medios y prensa",
    path: "/shared/prensa",
    db: "estrategia",
    icon: "Newspaper",
    group: "Monitoreo",
  },
  {
    slug: "soporte",
    title: "Mesa de Ayuda",
    description: "Soporte y tickets — Custos",
    path: "/shared/soporte",
    db: "estrategia",
    icon: "LifeBuoy",
    group: "Transversal",
  },
];

export const VERTICAL_IDS = Object.keys(VERTICALS) as VerticalId[];

export const DEFAULT_VERTICAL: VerticalId = "cne";

export function isVerticalId(value: string | undefined | null): value is VerticalId {
  return value === "cne" || value === "ae";
}

export function getVertical(id: VerticalId): VerticalDef {
  return VERTICALS[id];
}

/** Módulos visibles para un vertical (propios + transversales). */
export function modulesFor(id: VerticalId): ModuleDef[] {
  return [...VERTICALS[id].modules, ...SHARED_MODULES];
}

/**
 * Dado el vertical destino y el módulo actual, devuelve la ruta equivalente.
 * Si existe un módulo con el mismo slug en el vertical destino, salta a él;
 * si no, cae al overview del vertical.
 */
export function equivalentPath(targetVertical: VerticalId, currentSlug?: string): string {
  if (currentSlug) {
    const match = VERTICALS[targetVertical].modules.find((m) => m.slug === currentSlug);
    if (match) return match.path;
  }
  return `/${targetVertical}`;
}
