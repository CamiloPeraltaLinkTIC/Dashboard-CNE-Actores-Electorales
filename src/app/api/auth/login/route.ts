import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "dashboard_auth";
// La cookie dura 8 horas
const COOKIE_MAX_AGE = 60 * 60 * 8;

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.DASHBOARD_PASSWORD;
    const viewerPassword = process.env.VIEWER_PASSWORD;

    let role = "";
    if (adminPassword && password === adminPassword) {
      role = "admin";
    } else if (viewerPassword && password === viewerPassword) {
      role = "viewer";
    }

    if (!role) {
      return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, role });
    response.cookies.set(AUTH_COOKIE, role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
