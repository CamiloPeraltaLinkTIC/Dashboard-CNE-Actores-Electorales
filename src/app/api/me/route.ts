import { NextResponse } from "next/server";
import { getServerAccess } from "@/lib/auth/access";

/** Acceso del usuario actual (rol + pantallas). Lo consume AccessSync para
 *  detectar cambios de rol/permisos y refrescar la UI sin cerrar sesión. */
export async function GET() {
  const access = await getServerAccess();
  if (!access) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  return NextResponse.json({
    role: access.role,
    screens: access.screens,
    name: access.name,
    email: access.email,
  });
}
