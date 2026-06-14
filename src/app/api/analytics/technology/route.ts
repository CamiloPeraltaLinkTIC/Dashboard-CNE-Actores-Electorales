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

    // Helper to request strict isolated dimensions sorted by users
    const queryGa4 = (dimensionName: string, limit = 15) => analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: dimensionName }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit
    });

    const [
      [categoriesReport],
      [modelsReport],
      [osReport],
      [resolutionReport],
      [browserReport],
      [sourceReport],
      [channelReport]
    ] = await Promise.all([
      queryGa4('deviceCategory', 5),
      queryGa4('mobileDeviceModel', 30),
      queryGa4('operatingSystem', 10),
      queryGa4('screenResolution', 15),
      queryGa4('browser', 12),
      queryGa4('sessionSource', 35),
      queryGa4('sessionDefaultChannelGroup', 15)
    ]);

    // Parse the reports out into a clean Name/Users structure
    const formatData = (report: any) => {
      const data = (report.rows || []).map((row: any) => ({
        name: row.dimensionValues?.[0]?.value || 'Desconocido',
        users: parseInt(row.metricValues?.[0]?.value || '0', 10)
      }));
      // Filtrar basura nativa de GA4
      return data.filter((item: any) => item.name !== '(not set)' && item.name !== '(not provided)' && item.name !== 'Desconocido');
    }

    return NextResponse.json({
      deviceCategory: formatData(categoriesReport),
      mobileDeviceModel: formatData(modelsReport),
      operatingSystem: formatData(osReport),
      screenResolution: formatData(resolutionReport),
      browser: formatData(browserReport),
      sessionSource: formatData(sourceReport),
      sessionChannel: formatData(channelReport)
    });

  } catch (error: any) {
    console.error('Error fetching GA4 Technology Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch technology data', details: error.message },
      { status: 500 }
    );
  }
}
