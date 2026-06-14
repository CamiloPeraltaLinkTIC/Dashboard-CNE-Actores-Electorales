import { NextResponse } from 'next/server';
import { analyticsDataClient } from '@/lib/ga';


const propertyId = process.env.GA_PROPERTY_ID;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA_PROPERTY_ID is not configured' },
        { status: 500 }
      );
    }

    // 1. Query Events (including scroll)
    const [eventsReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10
    });

    // 2. Query Page paths and titles
    const [pagesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 15
    });

    // Format events for Radar Chart
    const formattedEvents = (eventsReport.rows || []).map((row: any) => ({
      subject: row.dimensionValues?.[0]?.value || 'Desconocido',
      A: parseInt(row.metricValues?.[0]?.value || '0', 10),
      fullMark: 100 // We will calculate this dynamically in the frontend
    }));

    // Format pages for the table
    const formattedPages = (pagesReport.rows || []).map((row: any) => {
      const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const avgTimeRaw = parseFloat(row.metricValues?.[1]?.value || '0');
      const bounceRaw = parseFloat(row.metricValues?.[2]?.value || '0');

      // Format time (e.g. 1m 20s)
      const minutes = Math.floor(avgTimeRaw / 60);
      const seconds = Math.floor(avgTimeRaw % 60);
      const avgTimeFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      // Format bounce rate percentage
      const bounceFormatted = `${(bounceRaw * 100).toFixed(2)}%`;

      return {
        path: row.dimensionValues?.[0]?.value || '/',
        title: row.dimensionValues?.[1]?.value || 'Sin título',
        views,
        avgTime: avgTimeFormatted,
        bounce: bounceFormatted
      };
    });

    // Also get the total scroll events specifically for highlights
    const scrollEvent = formattedEvents.find(e => e.subject === 'scroll');
    const scrollCount = scrollEvent ? scrollEvent.A : 0;
    
    // Total events for calculation
    const totalEvents = formattedEvents.reduce((acc, curr) => acc + curr.A, 0);

    return NextResponse.json({
      events: formattedEvents,
      pages: formattedPages,
      metrics: {
        totalEvents,
        scrollCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching GA4 Behavior Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch behavior data', details: error.message },
      { status: 500 }
    );
  }
}
