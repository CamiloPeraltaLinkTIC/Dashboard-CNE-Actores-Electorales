import { NextResponse } from 'next/server';
import { analyticsDataClient } from '@/lib/ga';


const propertyId = process.env.GA_PROPERTY_ID;

type Order =
  | { by: 'dimension'; dimensionName: string }
  | { by: 'metric'; desc: boolean };

/**
 * Ejecuta un runReport probando una lista de nombres de métrica en orden y
 * devuelve el primero que funcione. GA4 renombró las métricas de conversión a
 * "key events" (conversions -> keyEvents, sessionConversionRate ->
 * sessionKeyEventRate); según la propiedad solo uno de los dos nombres
 * responde, así que probamos el nuevo primero y caemos al legado.
 *
 * Cuando se ordena por métrica, el orderBy usa el MISMO nombre de métrica que
 * se está probando (si no, GA4 rechaza el orderBy por no estar en la consulta).
 */
async function runReportWithMetricFallback(
  metricNames: string[],
  dimensionName: string,
  dateRange: { startDate: string; endDate: string },
  order: Order,
) {
  let lastError: unknown = null;
  for (const metric of metricNames) {
    try {
      const orderBys =
        order.by === 'dimension'
          ? [{ dimension: { dimensionName: order.dimensionName } }]
          : [{ metric: { metricName: metric }, desc: order.desc }];

      const [report] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        dimensions: [{ name: dimensionName }],
        metrics: [{ name: metric }],
        orderBys,
      });
      return report;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') || '30daysAgo';
        const endDate = searchParams.get('endDate') || 'today';
        const dateRange = { startDate, endDate };

        if (!propertyId) {
            return NextResponse.json({ error: 'GA_PROPERTY_ID is not configured' }, { status: 500 });
        }

        // Tasa de conversión a lo largo del tiempo (por día).
        let timelineData: { date: string; rate: number }[] = [];
        try {
            const timelineReport = await runReportWithMetricFallback(
                ['sessionKeyEventRate', 'sessionConversionRate'],
                'date',
                dateRange,
                { by: 'dimension', dimensionName: 'date' },
            );

            timelineData = (timelineReport.rows || []).map(row => {
                const dateStr = row.dimensionValues?.[0]?.value || '';
                const formattedDate = dateStr.length === 8
                    ? `${dateStr.substring(6,8)}/${dateStr.substring(4,6)}`
                    : dateStr;

                // GA4 devuelve la tasa como fracción (0.05 = 5%).
                const rawRate = parseFloat(row.metricValues?.[0]?.value || '0');
                const percentageRate = parseFloat((rawRate * 100).toFixed(2));

                return { date: formattedDate, rate: percentageRate };
            });
        } catch (e: any) {
            console.error('Error fetching GA4 conversion rate timeline:', e?.message || e);
        }

        // Eventos clave (conversiones) por tipo.
        let eventsData: { name: string; conversions: number }[] = [];
        try {
            const eventsReport = await runReportWithMetricFallback(
                ['keyEvents', 'conversions'],
                'eventName',
                dateRange,
                { by: 'metric', desc: true },
            );

            eventsData = (eventsReport.rows || [])
                .map(row => ({
                    name: row.dimensionValues?.[0]?.value || 'Desconocido',
                    conversions: parseInt(row.metricValues?.[0]?.value || '0', 10)
                }))
                .filter(e => e.conversions > 0); // Solo eventos que sean conversiones
        } catch (e: any) {
            console.error('Error fetching GA4 key events:', e?.message || e);
        }

        return NextResponse.json({
            timeline: timelineData,
            events: eventsData
        });

    } catch (error: any) {
        console.error('Error fetching GA4 Conversions Data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversions data', details: error.message },
            { status: 500 }
        );
    }
}
