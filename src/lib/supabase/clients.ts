import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Registry de clientes Supabase.
 *
 * Las 3 bases de datos del proyecto se mantienen SEPARADAS. Cada módulo del
 * dashboard pide su cliente por nombre (`getDb('estrategia')`) en lugar de
 * importar un cliente global, de modo que nunca se mezclan fuentes de datos.
 *
 * Si en el futuro se consolidan las 3 en un único proyecto Supabase, basta con
 * apuntar todos los alias a la misma URL aquí; la UI no cambia.
 */
const make = (url?: string, key?: string): SupabaseClient =>
  createClient(url ?? "", key ?? "", {
    auth: { persistSession: false },
  });

export const dbAnalytics = make(
  process.env.NEXT_PUBLIC_DB_ANALYTICS_URL,
  process.env.NEXT_PUBLIC_DB_ANALYTICS_ANON_KEY
);

export const dbEstrategia = make(
  process.env.NEXT_PUBLIC_DB_ESTRATEGIA_URL,
  process.env.NEXT_PUBLIC_DB_ESTRATEGIA_ANON_KEY
);

export const dbContent = make(
  process.env.NEXT_PUBLIC_DB_CONTENT_URL,
  process.env.NEXT_PUBLIC_DB_CONTENT_ANON_KEY
);

export const dbCampana = make(
  process.env.NEXT_PUBLIC_DB_CAMPANA_URL,
  process.env.NEXT_PUBLIC_DB_CAMPANA_ANON_KEY
);

export const DBS = {
  analytics: dbAnalytics,
  estrategia: dbEstrategia,
  content: dbContent,
  campana: dbCampana,
} as const;

export type DbName = keyof typeof DBS;

/** Devuelve el cliente Supabase del módulo indicado. */
export const getDb = (name: DbName): SupabaseClient => DBS[name];
