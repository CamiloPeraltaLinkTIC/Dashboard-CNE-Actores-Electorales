import { NextResponse } from "next/server";
import { getServerAccess } from "@/lib/auth/access";
import { getSocialMetrics } from "@/lib/social/metrics";

export const runtime = "nodejs";

/** Métricas por red/cuenta (seguidores, publicaciones, vistas + deltas). */
export async function GET(request: Request) {
  const access = await getServerAccess();
  if (!access) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const account = new URL(request.url).searchParams.get("account") || "cne";

  try {
    const accounts = await getSocialMetrics(account);
    return NextResponse.json({ ok: true, account, accounts });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
