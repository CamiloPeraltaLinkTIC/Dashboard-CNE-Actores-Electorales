import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "dashboard_auth";
const VERTICAL_COOKIE = "vertical";

/**
 * Middleware unificado:
 *  - Protege toda la app salvo /login y assets.
 *  - Inyecta cabeceras que el layout lee en SSR:
 *      x-pathname     -> ruta actual (para detectar /login y el módulo activo)
 *      x-user-role    -> rol del usuario (admin | viewer)
 *      x-vertical     -> vertical activo (cne | ae)
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(AUTH_COOKIE)?.value ?? "";
  const vertical = request.cookies.get(VERTICAL_COOKIE)?.value ?? "cne";
  const isLogin = pathname === "/login";
  const isAuthed = role === "admin" || role === "viewer";

  // Sin sesión y fuera de /login -> redirige a login
  if (!isAuthed && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión en /login -> manda al dashboard
  if (isAuthed && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = `/${vertical}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-user-role", role || "viewer");
  requestHeaders.set("x-vertical", vertical);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * Todo salvo: api, _next/static, _next/image, favicon y archivos públicos.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
