import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/access";
import { getEstrategiaAdmin } from "@/lib/supabase/estrategia-admin";
import { allScreens, type AppRole } from "@/lib/auth/rbac";

const VALID_ROLES: AppRole[] = ["superadmin", "admin", "viewer"];

/** PATCH: actualiza rol, nombre y/o pantallas asignadas de un usuario. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperadmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido." }, { status: 400 });

  const admin = getEstrategiaAdmin();

  const profileUpdate: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }
    // Evitar que el superadmin se quite a sí mismo el rol y se quede bloqueado.
    if (guard.access.userId === id && body.role !== "superadmin") {
      return NextResponse.json({ error: "No puedes cambiar tu propio rol." }, { status: 400 });
    }
    profileUpdate.user_role = body.role as AppRole;
  }
  if (body.full_name !== undefined) {
    profileUpdate.full_name = String(body.full_name).trim() || null;
  }
  if (Object.keys(profileUpdate).length) {
    const { error } = await admin.from("profiles").upsert({ id, ...profileUpdate }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (Array.isArray(body.screens)) {
    const validKeys = new Set(allScreens().map((s) => s.key));
    const screens = body.screens.map(String).filter((s: string) => validKeys.has(s));
    await admin.from("user_screen_access").delete().eq("user_id", id);
    if (screens.length) {
      await admin.from("user_screen_access").insert(
        screens.map((s: string) => ({ user_id: id, screen_key: s })),
      );
    }
  }

  return NextResponse.json({ ok: true });
}

/** DELETE: elimina el usuario (cascade borra perfil y accesos). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperadmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  if (guard.access.userId === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const admin = getEstrategiaAdmin();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
