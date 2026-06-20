import { getCampanaAdmin } from "@/lib/supabase/campana-admin";
import {
  CONTENT_TRACKING_FIELDS,
  type ContentTrackingData,
  type ContentTrackingField,
} from "./types";

/**
 * Carga el resumen de contenidos (cards) de la primera campaña registrada.
 * Devuelve null si no existe ninguna campaña; ceros si aún no hay registro
 * (la pantalla muestra los defaults editables).
 */
export async function getContentTracking(): Promise<ContentTrackingData | null> {
  const supabase = getCampanaAdmin();

  const { data: campaign, error } = await supabase
    .from("campaign_dash")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) throw error;
  if (!campaign) return null;

  const { data: summary, error: summaryError } = await supabase
    .from("content_tracking_summary")
    .select(CONTENT_TRACKING_FIELDS.join(", "))
    .eq("campaign_id", campaign.id)
    .maybeSingle<Record<ContentTrackingField, number>>();

  if (summaryError) throw summaryError;

  const values = Object.fromEntries(
    CONTENT_TRACKING_FIELDS.map((f) => [f, summary?.[f] ?? 0]),
  ) as Record<ContentTrackingField, number>;

  return { campaignId: campaign.id, ...values };
}
