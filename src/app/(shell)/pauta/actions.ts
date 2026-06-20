"use server";

import { revalidatePath } from "next/cache";
import { getCampanaAdmin } from "@/lib/supabase/campana-admin";
import { getServerAccess } from "@/lib/auth/access";
import { canEdit } from "@/lib/auth/rbac";
import { CONTENT_TRACKING_FIELDS } from "@/lib/campana/types";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Devuelve un ActionResult de error si el usuario no puede editar; null si sí. */
async function ensureEditor(): Promise<ActionResult | null> {
  const access = await getServerAccess();
  if (!access || !canEdit(access.role)) return { ok: false, error: "No autorizado." };
  return null;
}

function num(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? "").replace(",", ".");
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export async function updateParamsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await ensureEditor();
  if (denied) return denied;
  const id = String(formData.get("campaign_id") ?? "");
  if (!id) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getCampanaAdmin();
    const { error } = await supabase
      .from("campaign_dash")
      .update({
        name: String(formData.get("name") ?? "").trim() || "Campaña de pauta",
        total_budget: num(formData, "total_budget"),
        duration_days: Math.round(num(formData, "duration_days")) || 1,
        start_date: String(formData.get("start_date") ?? ""),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/pauta", "layout");
    return { ok: true, message: "Parámetros de campaña guardados correctamente." };
  } catch {
    return { ok: false, error: "No se pudieron guardar los parámetros. Intenta de nuevo." };
  }
}

export async function updateChannelAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await ensureEditor();
  if (denied) return denied;
  const id = String(formData.get("channel_id") ?? "");
  if (!id) return { ok: false, error: "ID de canal no encontrado." };

  try {
    const supabase = getCampanaAdmin();
    const { error } = await supabase
      .from("campaign_channels")
      .update({
        participation_pct: num(formData, "participation_pct") / 100,
        cpm: num(formData, "cpm"),
        ctr: num(formData, "ctr") / 100,
        frequency: num(formData, "frequency") || 1,
        objective: String(formData.get("objective") ?? "").trim() || null,
        target_audience: String(formData.get("target_audience") ?? "").trim() || null,
        main_kpi: String(formData.get("main_kpi") ?? "").trim() || null,
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/pauta", "layout");
    return { ok: true, message: "Canal actualizado correctamente." };
  } catch {
    return { ok: false, error: "No se pudo actualizar el canal. Intenta de nuevo." };
  }
}

export async function updateMetricsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await ensureEditor();
  if (denied) return denied;
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getCampanaAdmin();
    const { error } = await supabase
      .from("campaign_metrics")
      .upsert(
        {
          campaign_id: campaignId,
          inversion_acumulada: num(formData, "inversion_acumulada"),
          impresion_acumulada: Math.round(num(formData, "impresion_acumulada")),
          pacing_presupuestal: num(formData, "pacing_presupuestal"),
          alcance_acumulado: Math.round(num(formData, "alcance_acumulado")),
        },
        { onConflict: "campaign_id" },
      );

    if (error) throw error;
    revalidatePath("/pauta", "layout");
    return { ok: true, message: "Métricas acumuladas guardadas correctamente." };
  } catch {
    return { ok: false, error: "No se pudieron guardar las métricas. Intenta de nuevo." };
  }
}

export async function saveDailyActualsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await ensureEditor();
  if (denied) return denied;
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getCampanaAdmin();
    const rows: {
      campaign_id: string;
      day_number: number;
      date: string;
      meta: number;
      pilas: number;
      youtube: number;
      google_display: number;
    }[] = [];

    for (let i = 1; i <= 60; i++) {
      const date = formData.get(`date_${i}`);
      if (!date) break;
      rows.push({
        campaign_id: campaignId,
        day_number: i,
        date: String(date),
        meta: num(formData, `meta_${i}`),
        pilas: num(formData, `pilas_${i}`),
        youtube: num(formData, `youtube_${i}`),
        google_display: num(formData, `google_display_${i}`),
      });
    }

    if (rows.length === 0) return { ok: false, error: "No se encontraron datos de días." };

    const { error } = await supabase
      .from("campaign_daily_actuals")
      .upsert(rows, { onConflict: "campaign_id,day_number" });

    if (error) throw error;
    revalidatePath("/pauta", "layout");
    return { ok: true, message: `Datos reales guardados para ${rows.length} días.` };
  } catch {
    return { ok: false, error: "No se pudieron guardar los datos. Intenta de nuevo." };
  }
}

export async function saveDailyImpressionsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await ensureEditor();
  if (denied) return denied;
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getCampanaAdmin();
    const rows: {
      campaign_id: string;
      day_number: number;
      date: string;
      meta: number;
      pilas: number;
      youtube: number;
      google_display: number;
    }[] = [];

    for (let i = 1; i <= 60; i++) {
      const date = formData.get(`date_${i}`);
      if (!date) break;
      rows.push({
        campaign_id: campaignId,
        day_number: i,
        date: String(date),
        meta: Math.round(num(formData, `meta_${i}`)),
        pilas: Math.round(num(formData, `pilas_${i}`)),
        youtube: Math.round(num(formData, `youtube_${i}`)),
        google_display: Math.round(num(formData, `google_display_${i}`)),
      });
    }

    if (rows.length === 0) return { ok: false, error: "No se encontraron datos de días." };

    const { error } = await supabase
      .from("campaign_daily_impressions")
      .upsert(rows, { onConflict: "campaign_id,day_number" });

    if (error) throw error;
    revalidatePath("/pauta", "layout");
    return { ok: true, message: `Impresiones guardadas para ${rows.length} días.` };
  } catch {
    return { ok: false, error: "No se pudieron guardar las impresiones. Intenta de nuevo." };
  }
}

export async function saveContentTrackingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await ensureEditor();
  if (denied) return denied;
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getCampanaAdmin();

    const row: Record<string, string | number> = { campaign_id: campaignId };
    for (const f of CONTENT_TRACKING_FIELDS) {
      row[f] = Math.max(0, Math.round(num(formData, f)));
    }

    const summaryRes = await supabase
      .from("content_tracking_summary")
      .upsert(row, { onConflict: "campaign_id" });
    if (summaryRes.error) throw summaryRes.error;

    revalidatePath("/pauta", "layout");
    return { ok: true, message: "Seguimiento de contenidos guardado correctamente." };
  } catch {
    return { ok: false, error: "No se pudo guardar el seguimiento. Intenta de nuevo." };
  }
}

export async function updateRealInvestmentAction(formData: FormData) {
  const access = await getServerAccess();
  if (!access || !canEdit(access.role)) return;
  const id = String(formData.get("channel_id") ?? "");
  if (!id) return;

  const supabase = getCampanaAdmin();
  const { error } = await supabase
    .from("campaign_channels")
    .update({ real_investment: parseFloat(String(formData.get("real_investment") ?? "0")) || 0 })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/pauta", "layout");
}
