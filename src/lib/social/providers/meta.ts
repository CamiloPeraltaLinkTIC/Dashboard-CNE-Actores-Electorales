import "server-only";
import type { AccountMetrics } from "../types";

/**
 * Métricas de Facebook / Instagram vía Meta Graph API. ENCHUFABLE: requiere un
 * Page Access Token (de larga duración) por cuenta, en la env `META_PAGE_TOKENS`
 * (JSON `{ "<pageOrIgId>": "<token>" }`). Sin token para esa cuenta → null.
 *
 * El usuario hoy NO tiene tokens de Meta, así que esto devuelve null hasta que
 * los configure (la cuenta se sigue listando como "métrica no disponible").
 */
function metaTokens(): Record<string, string> {
  try {
    return JSON.parse(process.env.META_PAGE_TOKENS || "{}");
  } catch {
    return {};
  }
}

const GRAPH = "https://graph.facebook.com/v21.0";

export async function metaMetrics(network: string, id: string): Promise<AccountMetrics | null> {
  const token = metaTokens()[id];
  if (!token || !id) return null;

  try {
    if (network === "Facebook") {
      const res = await fetch(
        `${GRAPH}/${id}?fields=followers_count,fan_count&access_token=${token}`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      const j = await res.json();
      const followers = j.followers_count ?? j.fan_count ?? null;
      return { followers: followers != null ? Number(followers) : null, posts: null };
    }
    if (network === "Instagram") {
      const res = await fetch(
        `${GRAPH}/${id}?fields=followers_count,media_count&access_token=${token}`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      const j = await res.json();
      return {
        followers: j.followers_count != null ? Number(j.followers_count) : null,
        posts: j.media_count != null ? Number(j.media_count) : null,
      };
    }
  } catch {
    return null;
  }
  return null;
}
