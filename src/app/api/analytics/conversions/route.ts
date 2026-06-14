import { NextResponse } from 'next/server';
import { analyticsDataClient } from '@/lib/ga';


const propertyId = process.env.GA_PROPERTY_ID;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') || '30daysAgo';
        const endDate = searchParams.get('endDate') || 'today';

        if (!propertyId) {
            return NextResponse.json({ error: 'GA_PROPERTY_ID is not configured' }, { status: 500 });
        }

        const [timelineReport] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'sessionConversionRate' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }]
        });

        const timelineData = (timelineReport.rows || []).map(row => {
            const dateStr = row.dimensionValues?.[0]?.value || '';
            const formattedDate = dateStr.length === 8 
                ? `${dateStr.substring(6,8)}/${dateStr.substring(4,6)}` 
                : dateStr;
            
            // GA4 sessionConversionRate is a float (e.g., 0.05 for 5%)
            const rawRate = parseFloat(row.metricValues?.[0]?.value || '0');
            const percentageRate = parseFloat((rawRate * 100).toFixed(2));
            
            return {
                date: formattedDate,
                rate: percentageRate
            };
        });

        const [eventsReport] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'eventName' }],
            metrics: [{ name: 'conversions' }],
            orderBys: [{ metric: { metricName: 'conversions' }, desc: true }]
        });

        const eventsData = (eventsReport.rows || [])
            .map(row => ({
                name: row.dimensionValues?.[0]?.value || 'Desconocido',
                conversions: parseInt(row.metricValues?.[0]?.value || '0', 10)
            }))
            .filter(e => e.conversions > 0); // Solo retornar eventos que sean conversiones

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
