import { getCampaignData } from "@/lib/campana/data";
import { computeChannels, computeTotals } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatDecimal, formatNumber, formatPercent } from "@/lib/campana/format";
import { Card, CardBody, CardHeader } from "@/components/campana/ui/card";
import { PageHeader } from "@/components/campana/ui/page-header";
import { EmptyState } from "@/components/campana/ui/empty-state";
import { ChannelBadge } from "@/components/campana/ui/channel-badge";
import { ChannelBar, type BarDatum } from "@/components/campana/charts/channel-bar";
import { VerticalSync } from "@/components/layout/VerticalSync";

export default async function CanalesPage() {
  const data = await getCampaignData();
  if (!data) return <><VerticalSync id="campana" /><EmptyState /></>;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);

  const impressionsData: BarDatum[] = channels.map((c) => ({
    name: CHANNELS[c.channel].label,
    value: c.impressions,
    color: CHANNELS[c.channel].color,
  }));
  const clicksData: BarDatum[] = channels.map((c) => ({
    name: CHANNELS[c.channel].label,
    value: c.clicks,
    color: CHANNELS[c.channel].color,
  }));

  return (
    <div className="space-y-6 pb-12">
      <VerticalSync id="campana" />
      <PageHeader
        title="Distribución por Canal"
        description="Reparto presupuestario y métricas proyectadas por canal."
      />

      <Card>
        <CardHeader title="Presupuesto y proyección por canal" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-[var(--text-faint)]">
                <th className="px-4 py-3 font-bold">Canal</th>
                <th className="px-4 py-3 text-right font-bold">%</th>
                <th className="px-4 py-3 text-right font-bold">Presupuesto</th>
                <th className="px-4 py-3 text-right font-bold">Diario</th>
                <th className="px-4 py-3 text-right font-bold">CPM</th>
                <th className="px-4 py-3 text-right font-bold">Impresiones</th>
                <th className="px-4 py-3 text-right font-bold">CTR</th>
                <th className="px-4 py-3 text-right font-bold">Clicks</th>
                <th className="px-4 py-3 text-right font-bold">CPC</th>
                <th className="px-4 py-3 text-right font-bold">Alcance</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3"><ChannelBadge channel={c.channel} showSubtitle /></td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatPercent(c.participationPct, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-[var(--text)]">{formatCOP(c.plannedBudget)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatCOP(c.dailyBudget)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatCOP(c.cpm)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatNumber(c.impressions)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatPercent(c.ctr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatNumber(c.clicks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatCOP(c.cpc)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatNumber(c.reach)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/15 font-bold text-[var(--text)]">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right tabular-nums">100%</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.plannedBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.dailyBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.blendedCpm)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.impressions)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPercent(totals.weightedCtr)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.clicks)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.blendedCpc)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.reach)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-white/8 px-4 py-3 text-xs text-[var(--text-faint)]">
          * Alcance estimado = impresiones ÷ frecuencia por canal (frecuencia promedio{" "}
          {formatDecimal(channels.reduce((a, c) => a + c.frequency, 0) / (channels.length || 1))}x).
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Impresiones por canal" />
          <CardBody><ChannelBar data={impressionsData} unit="impresiones" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Clicks por canal" />
          <CardBody><ChannelBar data={clicksData} unit="clicks" /></CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Objetivos y tipo de pauta por canal" subtitle="Estrategia, público objetivo y KPI principal" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {channels.map((c) => {
              const meta = CHANNELS[c.channel];
              return (
                <div key={c.channel} className="glass p-4" style={{ borderTopColor: meta.color, borderTopWidth: 3 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <ChannelBadge channel={c.channel} showSubtitle />
                    <span className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-xs font-semibold text-[var(--text-dim)]">
                      {formatPercent(c.participationPct, 0)}
                    </span>
                  </div>
                  <dl className="space-y-2.5 text-sm">
                    <Field label="Objetivo" value={c.objective} />
                    <Field label="Público objetivo" value={c.targetAudience} />
                    <Field label="KPI principal" value={c.mainKpi} />
                  </dl>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">{label}</dt>
      <dd className="text-[var(--text)]">{value ?? "—"}</dd>
    </div>
  );
}
