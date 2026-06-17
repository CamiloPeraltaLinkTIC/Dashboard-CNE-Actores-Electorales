import "server-only";
import { getEstrategiaAdmin } from "@/lib/supabase/estrategia-admin";

/**
 * Snapshots diarios de métricas sociales (tabla `social_metrics_snapshots`),
 * para calcular los "nuevos seguidores / nuevas publicaciones" como delta entre
 * hoy y el último día registrado. Se guarda 1 snapshot por cuenta y día.
 */

/** Último snapshot ANTERIOR a `today` para una cuenta. */
export async function readPrevSnapshot(
  accountId: string,
  today: string,
): Promise<{ followers: number | null; posts: number | null } | null> {
  try {
    const { data } = await getEstrategiaAdmin()
      .from("social_metrics_snapshots")
      .select("followers, posts")
      .eq("account_id", accountId)
      .lt("day", today)
      .order("day", { ascending: false })
      .limit(1)
      .single();
    if (data) return { followers: data.followers, posts: data.posts };
  } catch {
    /* sin histórico todavía */
  }
  return null;
}

/** Guarda (o actualiza) el snapshot de HOY para una cuenta. */
export async function upsertTodaySnapshot(s: {
  accountId: string;
  network: string;
  day: string;
  followers: number | null;
  posts: number | null;
  views: number | null;
}): Promise<void> {
  try {
    await getEstrategiaAdmin()
      .from("social_metrics_snapshots")
      .upsert(
        {
          account_id: s.accountId,
          network: s.network,
          day: s.day,
          followers: s.followers,
          posts: s.posts,
          views: s.views,
        },
        { onConflict: "account_id,day" },
      );
  } catch (e) {
    console.warn("No se pudo guardar el snapshot social:", (e as Error).message);
  }
}
