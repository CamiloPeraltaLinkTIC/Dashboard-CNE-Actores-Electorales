import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase Auth (proyecto `estrategia`) para componentes "use client".
 *
 * La sesión de Supabase Auth (login de usuarios + roles) vive en el proyecto
 * `estrategia` — el mismo de Custos/soporte. Singleton para evitar el warning
 * "Multiple GoTrueClient instances".
 */
const url = process.env.NEXT_PUBLIC_DB_ESTRATEGIA_URL!;
const anonKey = process.env.NEXT_PUBLIC_DB_ESTRATEGIA_ANON_KEY!;

let browserClient: SupabaseClient | undefined;

export function getAuthBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
