import {
  VERTICALS,
  SHARED_MODULES,
  VERTICAL_IDS,
  DEFAULT_VERTICAL,
  rootPath,
  type ModuleDef,
  type VerticalId,
} from "@/lib/verticals";

/**
 * RBAC puro (sin dependencias de servidor): tipos, normalización de rol,
 * registro de pantallas y reglas de acceso. Seguro de importar en componentes
 * cliente y servidor.
 */

export type AppRole = "superadmin" | "admin" | "viewer";

export interface UserAccess {
  userId: string;
  email: string;
  /** Nombre visible (full_name / username), si existe. */
  name: string;
  role: AppRole;
  /** screen_keys (paths de módulo) permitidos. Vacío = sin acceso a módulos. */
  screens: string[];
}

/** Normaliza el rol guardado en `profiles.user_role` al rol de la app.
 *  Los legados 'reader'/'user' se tratan como 'viewer'. */
export function normalizeRole(dbRole: string | null | undefined): AppRole {
  if (dbRole === "superadmin") return "superadmin";
  if (dbRole === "admin") return "admin";
  return "viewer";
}

/** Puede editar/escribir (admin o superadmin). */
export function canEdit(role: AppRole | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperadmin(role: AppRole | null | undefined): boolean {
  return role === "superadmin";
}

/** Una "pantalla" gateable = un módulo (su `path` es la clave estable). */
export interface ScreenDef {
  key: string; // path del módulo, p.ej. "/ae/analytics"
  title: string;
  vertical: string; // id de vertical o "shared"
  group?: string;
}

/** Catálogo de todas las pantallas gateables (módulos de cada vertical +
 *  transversales), deduplicado por `key`. Los overviews (/cne, /ae, /pauta) NO
 *  se gatean: son landing pages visibles para cualquier usuario autenticado. */
export function allScreens(): ScreenDef[] {
  const seen = new Set<string>();
  const out: ScreenDef[] = [];
  const push = (m: ModuleDef, vertical: string) => {
    if (seen.has(m.path)) return;
    seen.add(m.path);
    out.push({ key: m.path, title: m.title, vertical, group: m.group });
  };
  for (const v of VERTICAL_IDS) {
    for (const m of VERTICALS[v].modules) push(m, v);
  }
  for (const m of SHARED_MODULES) push(m, "shared");
  return out;
}

const SCREEN_KEYS = new Set(allScreens().map((s) => s.key));

/** Devuelve la clave de pantalla (módulo) que cubre `path`, o null si el path
 *  no corresponde a una pantalla gateable (overview, /admin, raíz, etc.).
 *  Usa el match de prefijo más largo para soportar subrutas. */
export function screenKeyForPath(path: string): string | null {
  let best: string | null = null;
  for (const key of SCREEN_KEYS) {
    if (path === key || path.startsWith(key + "/")) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best;
}

/**
 * ¿El usuario puede acceder a `path`?
 * - superadmin: todo.
 * - `/admin/**`: solo superadmin.
 * - paths que no son pantalla gateable (overviews, raíz): permitido a autenticados.
 * - pantallas de módulo: solo si su clave está en `access.screens`.
 */
export function isPathAllowed(access: Pick<UserAccess, "role" | "screens">, path: string): boolean {
  if (access.role === "superadmin") return true;
  if (path === "/admin" || path.startsWith("/admin/")) return false;
  const key = screenKeyForPath(path);
  if (!key) return true;
  return access.screens.includes(key);
}

/**
 * Ruta de aterrizaje tras el login (`/`). Debe llevar al usuario a un vertical
 * que realmente pueda ver, no siempre al overview por defecto (CNE).
 * - superadmin: respeta el vertical preferido (cookie) o el por defecto.
 * - resto: el primer vertical que contenga alguna de sus pantallas permitidas
 *   (priorizando el preferido si tiene acceso ahí). Si solo tiene módulos
 *   transversales, aterriza en la primera pantalla permitida.
 */
export function landingPathFor(
  access: Pick<UserAccess, "role" | "screens">,
  preferredVertical?: VerticalId | null,
): string {
  if (access.role === "superadmin") {
    return rootPath(preferredVertical ?? DEFAULT_VERTICAL);
  }
  const owned = VERTICAL_IDS.filter((v) =>
    VERTICALS[v].modules.some((m) => access.screens.includes(m.path)),
  );
  const pick =
    preferredVertical && owned.includes(preferredVertical) ? preferredVertical : owned[0];
  if (pick) return rootPath(pick);
  // Solo módulos transversales (o ninguno): aterriza en la primera pantalla permitida.
  if (access.screens.length > 0) return access.screens[0];
  return rootPath(DEFAULT_VERTICAL);
}
