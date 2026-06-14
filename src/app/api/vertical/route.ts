import { NextRequest, NextResponse } from "next/server";
import { isVerticalId } from "@/lib/verticals";

const VERTICAL_COOKIE = "vertical";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/** Persiste el vertical activo (cne | ae) para SSR. */
export async function POST(request: NextRequest) {
  try {
    const { vertical } = await request.json();
    if (!isVerticalId(vertical)) {
      return NextResponse.json({ error: "Vertical inválido." }, { status: 400 });
    }
    const response = NextResponse.json({ success: true, vertical });
    response.cookies.set(VERTICAL_COOKIE, vertical, {
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
