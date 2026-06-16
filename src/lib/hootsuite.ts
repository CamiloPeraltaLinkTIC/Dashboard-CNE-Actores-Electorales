import "server-only";

/**
 * Cliente de la API de Hootsuite (platform.hootsuite.com).
 *
 * OAuth2 con refresh token por cuenta. Hoy la app usa la cuenta `cne`. El token
 * de acceso se cachea en memoria del servidor (con margen de 1 minuto antes de
 * expirar). SOLO debe importarse desde el servidor (Route Handlers).
 *
 * Variables de entorno:
 *  - HOOTSUITE_CLIENT_ID, HOOTSUITE_CLIENT_SECRET
 *  - CNE_HOOTSUITE_REFRESH_TOKEN (o HOOTSUITE_REFRESH_TOKEN como fallback)
 *  - ACTORES_HOOTSUITE_REFRESH_TOKEN (opcional, cuenta 'actores')
 */
const CLIENT_ID = process.env.HOOTSUITE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.HOOTSUITE_CLIENT_SECRET || "";

interface AccountState {
  accessToken: string | null;
  expiresAt: number;
}

const accountStates: Record<string, AccountState> = {
  cne: { accessToken: null, expiresAt: 0 },
  actores: { accessToken: null, expiresAt: 0 },
};

/** Renueva (o reutiliza) el access token de la cuenta indicada. */
export async function getHootsuiteAccessToken(account: string = "cne"): Promise<string> {
  const state = accountStates[account] || { accessToken: null, expiresAt: 0 };

  if (state.accessToken && Date.now() < state.expiresAt - 60000) {
    return state.accessToken;
  }

  const REFRESH_TOKEN =
    account === "actores"
      ? process.env.ACTORES_HOOTSUITE_REFRESH_TOKEN || process.env.HOOTSUITE_REFRESH_TOKEN
      : process.env.CNE_HOOTSUITE_REFRESH_TOKEN || process.env.HOOTSUITE_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error(`Faltan credenciales de Hootsuite en .env.local para la cuenta ${account}.`);
  }

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", REFRESH_TOKEN);

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

  state.accessToken = data.access_token;
  state.expiresAt = Date.now() + data.expires_in * 1000;
  accountStates[account] = state;
  return state.accessToken!;
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
    FACEBOOKPAGE: "Facebook",
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    INSTAGRAMBUSINESS: "Instagram",
    LINKEDINCOMPANY: "LinkedIn",
    LINKEDIN: "LinkedIn",
    YOUTUBE: "YouTube",
    TIKTOK: "TikTok",
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
