import { NextResponse } from "next/server";
import { getServerAccess } from "@/lib/auth/access";

export const runtime = "nodejs";

// Hosts de CDN de avatares permitidos (evita SSRF: solo imágenes de redes).
const ALLOWED_HOSTS = [
  /\.ggpht\.com$/,
  /\.googleusercontent\.com$/,
  /\.fbcdn\.net$/,
  /\.cdninstagram\.com$/,
  /\.twimg\.com$/,
  /\.licdn\.com$/,
  /tiktokcdn/,
  /hootsuite/,
];

/** Proxy de avatares de Hootsuite: trae la imagen server-side para sortear el
 *  hotlink/referrer de los CDNs (fbcdn, ggpht…) que bloquean la carga directa. */
export async function GET(request: Request) {
  const access = await getServerAccess();
  if (!access) return new NextResponse("No autenticado", { status: 401 });

  const u = new URL(request.url).searchParams.get("u");
  if (!u) return new NextResponse("Falta el parámetro u", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new NextResponse("URL inválida", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.some((re) => re.test(target.hostname))) {
    return new NextResponse("Host no permitido", { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
      cache: "no-store",
    });
    if (!res.ok) return new NextResponse("Imagen no disponible", { status: 502 });

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Error al obtener la imagen", { status: 502 });
  }
}
