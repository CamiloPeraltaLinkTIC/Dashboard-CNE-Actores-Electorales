import { getCampanaAdmin } from "@/lib/supabase/campana-admin";
import type {
  Campaign,
  CampaignChannel,
  CampaignData,
  CampaignMetrics,
  DailyActuals,
  DailyImpressions,
  DailyPlan,
  ParsedPlan,
} from "./types";
import { CHANNEL_ORDER } from "./constants";

export async function getCampaignData(): Promise<CampaignData | null> {
  const supabase = getCampanaAdmin();

  const { data: campaign, error } = await supabase
    .from("campaign_dash")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Campaign>();

  if (error) throw error;
  if (!campaign) return null;

  const [channelsRes, daysRes, metricsRes, actualsRes, impressionsRes] = await Promise.all([
    supabase.from("campaign_channels").select("*").eq("campaign_id", campaign.id),
    supabase
      .from("daily_plan")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("day_number", { ascending: true }),
    supabase
      .from("campaign_metrics")
      .select("*")
      .eq("campaign_id", campaign.id)
      .maybeSingle<CampaignMetrics>(),
    supabase
      .from("campaign_daily_actuals")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("day_number", { ascending: true }),
    supabase
      .from("campaign_daily_impressions")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("day_number", { ascending: true }),
  ]);

  if (channelsRes.error) throw channelsRes.error;
  if (daysRes.error) throw daysRes.error;

  const channels = (channelsRes.data as CampaignChannel[]).sort(
    (a, b) => CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel),
  );

  return {
    campaign,
    channels,
    days: daysRes.data as DailyPlan[],
    metrics: metricsRes.data ?? null,
    actuals: (actualsRes.data as DailyActuals[]) ?? [],
    impressions: (impressionsRes.data as DailyImpressions[]) ?? [],
  };
}

async function ensureCampaignId(): Promise<string> {
  const supabase = getCampanaAdmin();
  const { data } = await supabase
    .from("campaign_dash")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (data?.id) return data.id;

  const { data: created, error } = await supabase
    .from("campaign_dash")
    .insert({ name: "Campaña de pauta" })
    .select("id")
    .single<{ id: string }>();

  if (error) throw error;
  return created.id;
}

export async function replaceCampaignFromPlan(plan: ParsedPlan): Promise<void> {
  const supabase = getCampanaAdmin();
  const campaignId = await ensureCampaignId();

  const { data: prev } = await supabase
    .from("campaign_channels")
    .select("channel, real_investment")
    .eq("campaign_id", campaignId);

  const realByChannel = new Map<string, number>(
    (prev ?? []).map((r) => [r.channel as string, Number(r.real_investment) || 0]),
  );

  const { error: upErr } = await supabase
    .from("campaign_dash")
    .update({
      name: plan.name,
      total_budget: plan.total_budget,
      duration_days: plan.duration_days,
      start_date: plan.start_date,
    })
    .eq("id", campaignId);
  if (upErr) throw upErr;

  await supabase.from("campaign_channels").delete().eq("campaign_id", campaignId);
  const channelRows = plan.channels.map((c, i) => ({
    campaign_id: campaignId,
    channel: c.channel,
    position: i,
    participation_pct: c.participation_pct,
    cpm: c.cpm,
    ctr: c.ctr,
    frequency: c.frequency,
    objective: c.objective,
    target_audience: c.target_audience,
    main_kpi: c.main_kpi,
    real_investment: realByChannel.get(c.channel) ?? 0,
  }));
  const { error: chErr } = await supabase.from("campaign_channels").insert(channelRows);
  if (chErr) throw chErr;

  await supabase.from("daily_plan").delete().eq("campaign_id", campaignId);
  const dayRows = plan.days.map((d) => ({
    campaign_id: campaignId,
    day_number: d.day_number,
    date: d.date,
    weight_factor: d.weight_factor,
  }));
  const { error: dErr } = await supabase.from("daily_plan").insert(dayRows);
  if (dErr) throw dErr;

  await supabase
    .from("campaign_metrics")
    .upsert({ campaign_id: campaignId }, { onConflict: "campaign_id", ignoreDuplicates: true });
}
