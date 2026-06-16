import { getCampaignData } from "@/lib/campana/data";
import { computeDaily } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatDate, formatDateShort, formatDecimal, formatNumber } from "@/lib/campana/format";
import { Card, CardBody, CardHeader } from "@/components/campana/ui/card";
import { PageHeader } from "@/components/campana/ui/page-header";
import { EmptyState } from "@/components/campana/ui/empty-state";
import { DailyArea, type DailyAreaDatum } from "@/components/campana/charts/daily-area";
import { VerticalSync } from "@/components/layout/VerticalSync";

export default async function DiarioPage() {
  const data = await getCampaignData();
  if (!data) return <><VerticalSync id="campana" /><EmptyState /></>;

  const daily = computeDaily(data);

  const area: DailyAreaDatum[] = daily.map((d) => ({
    label: formatDateShort(d.date),
    meta: d.byChannel.meta?.investment ?? 0,
    pilas: d.byChannel.pilas?.investment ?? 0,
    youtube: d.byChannel.youtube?.investment ?? 0,
    google_display: d.byChannel.google_display?.investment ?? 0,
  }));

  const totalInvestment = daily.reduce((a, d) => a + d.totalInvestment, 0);
  const totalFactor = daily.reduce((a, d) => a + d.weightFactor, 0);
  const peak = daily.reduce(
    (max, d) => (d.totalInvestment > max.totalInvestment ? d : max),
    daily[0],
  );

  return (
    <div className="space-y-6 pb-12">
      <VerticalSync id="campana" />
      <PageHeader
        title="Desglose Diario"
        description="Inversión distribuida día a día. El factor de peso determina cuánto presupuesto recibe cada día."
      />

      <Card>
        <CardHeader
          title="Curva de inversión diaria"
          subtitle={`Día pico: ${formatDate(peak.date)} con ${formatCOP(peak.totalInvestment)}`}
        />
        <CardBody><DailyArea data={area} /></CardBody>
      </Card>

      <Card>
        <CardHeader title="Detalle por día" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-[var(--text-faint)]">
                <th className="px-4 py-3 font-medium">Día</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Factor</th>
                <th className="px-4 py-3 text-right font-medium">Total / día</th>
                {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                  <th key={k} className="px-4 py-3 text-right font-medium">{CHANNELS[k].label}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Impresiones</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.dayNumber} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-bold text-[var(--text)]">{d.dayNumber}</td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">{formatDate(d.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatDecimal(d.weightFactor)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-[var(--text)]">{formatCOP(d.totalInvestment)}</td>
                  {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                    <td key={k} className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">
                      {formatCOP(d.byChannel[k]?.investment ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">{formatNumber(d.totalImpressions)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/15 font-bold text-[var(--text)]">
                <td className="px-4 py-3" colSpan={2}>Total · {daily.length} días</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatDecimal(totalFactor)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totalInvestment)}</td>
                {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                  <td key={k} className="px-4 py-3 text-right tabular-nums">
                    {formatCOP(daily.reduce((a, d) => a + (d.byChannel[k]?.investment ?? 0), 0))}
                  </td>
                ))}
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(daily.reduce((a, d) => a + d.totalImpressions, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-white/8 px-4 py-3 text-xs text-[var(--text-faint)]">
          * Inversión diaria = presupuesto total × factor ÷ suma de factores.
        </div>
      </Card>
    </div>
  );
}
