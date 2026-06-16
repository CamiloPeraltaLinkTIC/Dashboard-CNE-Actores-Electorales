import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase con service role para operaciones de escritura en campaña.
// Solo se importa desde Server Components / Server Actions / Route Handlers.

let cached: SupabaseClient | null = null;

export function getCampanaAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_DB_CAMPANA_URL;
  const serviceKey = process.env.DB_CAMPANA_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_DB_CAMPANA_URL y/o DB_CAMPANA_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
