import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE ROLE del proyecto `estrategia`.
 *
 * Se usa para la Admin API de Supabase Auth (crear/editar/eliminar usuarios) y
 * para escrituras que deben saltar RLS (perfiles, accesos por pantalla). SOLO se
 * importa desde el servidor (Route Handlers / Server Actions). Mismo patrón que
 * `campana-admin.ts`.
 */
let cached: SupabaseClient | null = null;

export function getEstrategiaAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_DB_ESTRATEGIA_URL;
  const serviceKey = process.env.DB_ESTRATEGIA_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_DB_ESTRATEGIA_URL y/o DB_ESTRATEGIA_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
