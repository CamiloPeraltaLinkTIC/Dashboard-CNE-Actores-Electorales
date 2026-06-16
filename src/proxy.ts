import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPathAllowed, normalizeRole, screenKeyForPath } from "@/lib/auth/rbac";

/**
 * Proxy (middleware en Next 16) de sesión — Supabase Auth, proyecto estrategia.
 *  - Refresca la sesión en cada request (cookies @supabase/ssr).
 *  - Sin sesión y fuera de /login → redirige a /login.
 *  - Con sesión en /login → redirige al inicio.
 *  - Control de acceso por pantalla (server-side) en cada navegación.
 *  - Fail-open si Supabase no responde (no tumbar la app por red/DNS).
 */
export async function proxy(request: NextRequest) {
  // Propaga la ruta actual al layout SSR (para el control de acceso por pantalla).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_DB_ESTRATEGIA_URL!,
    process.env.NEXT_PUBLIC_DB_ESTRATEGIA_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return supabaseResponse; // fail-open: la sesión se revalida en el próximo request
  }

  const isLogin = request.nextUrl.pathname === "/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Control de acceso por pantalla (server-side). Corre también en la navegación
  // del cliente, que es justo donde el gating del layout no alcanzaba. Se consulta
  // el rol y las pantallas SOLO cuando la ruta es gateable (módulo o /admin); los
  // overviews y la raíz se permiten sin consultar.
  if (user && !isLogin) {
    const path = request.nextUrl.pathname;
    const gateable = path === "/admin" || path.startsWith("/admin/") || screenKeyForPath(path) !== null;
    if (gateable) {
      const [{ data: profile }, { data: rows }] = await Promise.all([
        supabase.from("profiles").select("user_role").eq("id", user.id).single(),
        supabase.from("user_screen_access").select("screen_key").eq("user_id", user.id),
      ]);
      const role = normalizeRole(profile?.user_role);
      const screens = (rows ?? []).map((r) => r.screen_key as string);
      if (!isPathAllowed({ role, screens }, path)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Todo salvo: api, assets de Next, favicon y archivos públicos.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
