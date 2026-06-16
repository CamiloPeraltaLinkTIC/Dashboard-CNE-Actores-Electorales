"use server";

import { redirect } from "next/navigation";
import { getAuthServerClient } from "@/lib/supabase/auth-server";

export type AuthState = {
  error: string | null;
};

/**
 * Login con Supabase Auth (proyecto estrategia). Acepta email completo o un
 * usuario corto (se convierte a `<usuario>@yopmail.com`, igual que el proyecto
 * de referencia, para mantener compatibilidad con los usuarios ya creados).
 */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Ingresa usuario y contraseña." };
  }

  const supabase = await getAuthServerClient();
  const email = username.includes("@") ? username : `${username}@yopmail.com`;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Credenciales de acceso incorrectas." };
  }

  redirect("/");
}

/** Cierra la sesión de Supabase y vuelve al login. */
export async function signOut() {
  const supabase = await getAuthServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
