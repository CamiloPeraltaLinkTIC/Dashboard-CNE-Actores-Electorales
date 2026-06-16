import { NextResponse } from "next/server";
import { saveRefreshToken } from "@/lib/hootsuite";

export const runtime = "nodejs";

// Cuenta a la que pertenece la autorización (este flujo es para CNE).
const ACCOUNT = "cne";

/**
 * Flujo OAuth2 de Hootsuite para GENERAR el refresh token (uso único de setup).
 *  - Sin `code`: muestra el enlace para autorizar en Hootsuite.
 *  - Con `code`: lo intercambia por el refresh_token y lo muestra para copiarlo
 *    en `.env.local` como CNE_HOOTSUITE_REFRESH_TOKEN.
 *
 * El redirect URI se deriva del origen de la petición; ese MISMO URI debe estar
 * registrado en el panel de desarrollador de Hootsuite.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const redirectUri = `${origin}/api/auth/hootsuite`;

  if (error) {
    return NextResponse.json({ error: "OAuth falló", details: error });
  }

  if (!code) {
    const clientId = process.env.HOOTSUITE_CLIENT_ID || "FALTA_HOOTSUITE_CLIENT_ID_EN_ENV_LOCAL";
    const authUrl = `https://platform.hootsuite.com/oauth2/auth?response_type=code&client_id=${clientId}&scope=offline&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;line-height:1.6;background:#0b1120;color:#e8edf7;">
        <h2>Conectar Hootsuite (cuenta CNE)</h2>
        <p>Autoriza la aplicación en Hootsuite con la cuenta del <strong>CNE</strong> para obtener el refresh token.</p>
        <a href="${authUrl}" style="display:inline-block;padding:10px 20px;background:#22d3ee;color:#001016;text-decoration:none;border-radius:8px;font-weight:bold;">Autorizar con Hootsuite</a>
        <p style="margin-top:20px;color:#8a93a8;font-size:14px;">
          Registra este <strong>Redirect URI</strong> en el panel de desarrollador de Hootsuite:<br>
          <code style="color:#22d3ee;">${redirectUri}</code>
        </p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }

  try {
    const clientId = process.env.HOOTSUITE_CLIENT_ID;
    const clientSecret = process.env.HOOTSUITE_CLIENT_SECRET;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);

    const tokenResponse = await fetch("https://platform.hootsuite.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "No se pudo intercambiar el token", details: data });
    }

    // Guardar el refresh token en BD (no en .env): las rotaciones se persisten solas.
    if (data.refresh_token) {
      await saveRefreshToken(ACCOUNT, data.refresh_token);
    }

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;line-height:1.6;background:#0b1120;color:#e8edf7;">
        <div style="max-width:640px;margin:0 auto;background:#111621;padding:30px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
          <h2 style="color:#22d3ee;margin-top:0;">¡Hootsuite conectado!</h2>
          <p>La cuenta <strong>${ACCOUNT.toUpperCase()}</strong> quedó vinculada y el token se guardó de forma segura.
          Ya puedes cerrar esta ventana y abrir la pestaña <strong>"En vivo (Hootsuite)"</strong> en Redes Sociales de CNE.</p>
          <p style="font-size:13px;color:#8a93a8;">No necesitas pegar nada en <code>.env.local</code>; las renovaciones se gestionan automáticamente.</p>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (err) {
    return NextResponse.json({ error: "Error interno", details: (err as Error).message });
  }
}
