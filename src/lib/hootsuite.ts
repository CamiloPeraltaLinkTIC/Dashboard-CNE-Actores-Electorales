import "server-only";
import { getEstrategiaAdmin } from "@/lib/supabase/estrategia-admin";

/**
 * Cliente de la API de Hootsuite (platform.hootsuite.com).
 *
 * OAuth2 con refresh token ROTATIVO (un solo uso): cada renovación devuelve un
 * nuevo refresh token e invalida el anterior. Por eso se persiste en la tabla
 * `hootsuite_tokens` (Supabase estrategia) y se actualiza en cada renovación.
 * El access token se cachea en memoria del servidor. SOLO desde el servidor.
 *
 * Variables de entorno:
 *  - HOOTSUITE_CLIENT_ID, HOOTSUITE_CLIENT_SECRET
 *  - CNE_HOOTSUITE_REFRESH_TOKEN (semilla inicial; luego manda la BD)
 */
const CLIENT_ID = process.env.HOOTSUITE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.HOOTSUITE_CLIENT_SECRET || "";

interface AccountState {
  accessToken: string | null;
  expiresAt: number;
}
const accountStates: Record<string, AccountState> = {};
// Mutex por cuenta: evita que dos peticiones concurrentes quemen el mismo
// refresh token de un solo uso ("already used").
const refreshLocks: Record<string, Promise<string> | undefined> = {};

/** Refresh token vigente: primero la BD, si no, la semilla del .env. */
async function getStoredRefreshToken(account: string): Promise<string | null> {
  try {
    const { data } = await getEstrategiaAdmin()
      .from("hootsuite_tokens")
      .select("refresh_token")
      .eq("account", account)
      .single();
    if (data?.refresh_token) return data.refresh_token;
  } catch {
    /* tabla vacía o sin BD: caemos a la semilla del entorno */
  }
  return account === "actores"
    ? process.env.ACTORES_HOOTSUITE_REFRESH_TOKEN || process.env.HOOTSUITE_REFRESH_TOKEN || null
    : process.env.CNE_HOOTSUITE_REFRESH_TOKEN || process.env.HOOTSUITE_REFRESH_TOKEN || null;
}

/** Persiste el refresh token (rotado o inicial) para una cuenta. */
export async function saveRefreshToken(account: string, token: string): Promise<void> {
  try {
    await getEstrategiaAdmin()
      .from("hootsuite_tokens")
      .upsert({ account, refresh_token: token, updated_at: new Date().toISOString() }, { onConflict: "account" });
  } catch (e) {
    console.warn(`No se pudo persistir el refresh token de Hootsuite (${account}):`, (e as Error).message);
  }
}

async function doRefresh(account: string): Promise<string> {
  const refreshToken = await getStoredRefreshToken(account);
  if (!CLIENT_ID || !CLIENT_SECRET || !refreshToken) {
    throw new Error(`Faltan credenciales de Hootsuite para la cuenta ${account} (¿generaste el refresh token?).`);
  }

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const response = await fetch("https://platform.hootsuite.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error de Hootsuite (${account}): ${data.error_description || data.error}`);
  }

  // Rotación: guardar el nuevo refresh token ANTES de devolver, para no perderlo.
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await saveRefreshToken(account, data.refresh_token);
  }

  accountStates[account] = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token as string;
}

/** Access token vigente (renueva si hace falta, serializando renovaciones). */
export async function getHootsuiteAccessToken(account: string = "cne"): Promise<string> {
  const state = accountStates[account];
  if (state?.accessToken && Date.now() < state.expiresAt - 60000) {
    return state.accessToken;
  }
  if (!refreshLocks[account]) {
    refreshLocks[account] = doRefresh(account).finally(() => {
      refreshLocks[account] = undefined;
    });
  }
  return refreshLocks[account]!;
}

/** Petición autenticada a la API de Hootsuite. */
export async function fetchFromHootsuite(
  endpoint: string,
  options: RequestInit = {},
  account: string = "cne",
) {
  const token = await getHootsuiteAccessToken(account);
  const response = await fetch(`https://platform.hootsuite.com${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falló petición a Hootsuite (${response.status}): ${text}`);
  }
  return response.json();
}

/** Lista de perfiles sociales de la cuenta. */
export async function getSocialProfiles(account: string = "cne") {
  const data = await fetchFromHootsuite("/v1/socialProfiles", {}, account);
  return data.data || [];
}

/** Normaliza el tipo de red de Hootsuite a un nombre visual. */
export function mapNetworkName(hootsuiteType: string): string {
  const map: Record<string, string> = {
    TWITTER: "X",
    X: "X",
    FACEBOOKPAGE: "Facebook",
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    INSTAGRAMBUSINESS: "Instagram",
    LINKEDINCOMPANY: "LinkedIn",
    LINKEDIN: "LinkedIn",
    YOUTUBE: "YouTube",
    YOUTUBECHANNEL: "YouTube",
    TIKTOK: "TikTok",
    TIKTOKBUSINESS: "TikTok",
  };
  return map[hootsuiteType?.toUpperCase()] || hootsuiteType;
}

/** Color de marca por red (para gráficas/badges). */
export const NETWORK_COLORS: Record<string, string> = {
  X: "#e8edf7",
  Facebook: "#1877F2",
  Instagram: "#E4405F",
  LinkedIn: "#0A66C2",
  YouTube: "#FF0000",
  TikTok: "#22d3ee",
};
