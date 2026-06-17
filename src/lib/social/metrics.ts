import "server-only";
import { getSocialProfiles, mapNetworkName, NETWORK_COLORS } from "@/lib/hootsuite";
import { youtubeMetrics } from "./providers/youtube";
import { metaMetrics } from "./providers/meta";
import { readPrevSnapshot, upsertTodaySnapshot } from "./snapshots";
import type { AccountMetrics, MetricsAccount } from "./types";

interface RawProfile {
  id: string;
  type: string;
  socialNetworkId?: string;
  socialNetworkUsername?: string;
  avatarUrl?: string;
}

/** Métrica viva por red (según proveedor/credencial disponible). */
async function fetchMetrics(network: string, socialNetworkId: string): Promise<AccountMetrics | null> {
  if (network === "YouTube") return youtubeMetrics(socialNetworkId);
  if (network === "Facebook" || network === "Instagram") return metaMetrics(network, socialNetworkId);
  // X, TikTok, etc.: sin API viable → sin métricas.
  return null;
}

/**
 * Métricas por cuenta de la cuenta Hootsuite indicada: usa Hootsuite como
 * registro de cuentas (incluye los 2 canales de YouTube / 2 páginas de Facebook),
 * trae la métrica viva por proveedor, calcula deltas vs el snapshot anterior y
 * guarda el snapshot de hoy.
 */
export async function getSocialMetrics(account: string): Promise<MetricsAccount[]> {
  const raw = (await getSocialProfiles(account)) as RawProfile[];
  const today = new Date().toISOString().slice(0, 10);

  return Promise.all(
    raw.map(async (p): Promise<MetricsAccount> => {
      const network = mapNetworkName(p.type);
      const snid = p.socialNetworkId || "";
      const metrics = await fetchMetrics(network, snid);

      let newFollowers: number | null = null;
      let newPosts: number | null = null;

      if (metrics) {
        const prev = await readPrevSnapshot(p.id, today);
        if (prev) {
          if (metrics.followers != null && prev.followers != null) {
            newFollowers = metrics.followers - prev.followers;
          }
          if (metrics.posts != null && prev.posts != null) {
            newPosts = metrics.posts - prev.posts;
          }
        }
        await upsertTodaySnapshot({
          accountId: p.id,
          network,
          day: today,
          followers: metrics.followers,
          posts: metrics.posts,
          views: metrics.views ?? null,
        });
      }

      return {
        id: p.id,
        network,
        rawType: p.type,
        username: p.socialNetworkUsername || "—",
        avatarUrl: p.avatarUrl || "",
        socialNetworkId: snid,
        fill: NETWORK_COLORS[network] || "#22d3ee",
        followers: metrics?.followers ?? null,
        posts: metrics?.posts ?? null,
        views: metrics?.views ?? null,
        newFollowers,
        newPosts,
        available: !!metrics,
      };
    }),
  );
}
