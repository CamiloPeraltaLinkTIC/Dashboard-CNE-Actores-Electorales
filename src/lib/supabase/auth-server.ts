import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase Auth (proyecto `estrategia`) para Server Components, Route
 * Handlers y Server Actions. Lee y escribe las cookies de sesión de Supabase
 * Auth, manteniéndola sincronizada (@supabase/ssr).
 */
const url = process.env.NEXT_PUBLIC_DB_ESTRATEGIA_URL!;
const anonKey = process.env.NEXT_PUBLIC_DB_ESTRATEGIA_ANON_KEY!;

export async function getAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` puede fallar si se invoca desde un Server Component (solo
          // lectura). Es normal: el middleware refresca la sesión en su lugar.
        }
      },
    },
  });
}
