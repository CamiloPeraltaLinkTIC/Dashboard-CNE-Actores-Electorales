import "server-only";
import type { AccountMetrics } from "../types";

/**
 * Métricas de un canal de YouTube vía YouTube Data API v3 (`channels.list`).
 * Requiere `GOOGLE_API_KEY` (API key gratis de Google Cloud con la API habilitada)
 * y el channelId (= `socialNetworkId` de Hootsuite, formato `UC…`).
 * Devuelve null si falta la key, el id o la API no responde.
 */
export async function youtubeMetrics(channelId: string): Promise<AccountMetrics | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key || !channelId) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(channelId)}&key=${key}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const stats = json.items?.[0]?.statistics;
    if (!stats) return null;

    return {
      // subscriberCount puede venir oculto (hiddenSubscriberCount) → null.
      followers: stats.hiddenSubscriberCount ? null : Number(stats.subscriberCount) || 0,
      posts: Number(stats.videoCount) || 0,
      views: Number(stats.viewCount) || 0,
    };
  } catch {
    return null;
  }
}
