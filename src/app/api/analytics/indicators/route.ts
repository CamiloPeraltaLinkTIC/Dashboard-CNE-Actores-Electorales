import { NextResponse } from 'next/server';
import { analyticsDataClient } from '@/lib/ga';
import { differenceInDays, subDays, format, parseISO, isValid } from 'date-fns';


const propertyId = process.env.GA_PROPERTY_ID;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA_PROPERTY_ID is not configured in environment variables' },
        { status: 500 }
      );
    }

    // 1. Fetch data for the selected date range
    const [mainReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'newUsers' },
        { name: 'bounceRate' },
        { name: 'activeUsers' },
        { name: 'totalUsers' },
      ],
    });

    // 2. Fetch data for "this week" (last 7 days including today) and "last week" (the 7 days before that)
    const [weeklyReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: '7daysAgo', endDate: 'today' }, // Current Week
        { startDate: '14daysAgo', endDate: '8daysAgo' } // Previous Week
      ],
      metrics: [
        { name: 'totalUsers' }
      ],
    });

    // Parse main report
    const mainRow = mainReport.rows?.[0]?.metricValues || [];
    const newUsers = parseInt(mainRow[0]?.value || '0', 10);
    const bounceRate = parseFloat(mainRow[1]?.value || '0') * 100;
    const activeUsers = parseInt(mainRow[2]?.value || '0', 10);
    const totalUsers = parseInt(mainRow[3]?.value || '0', 10);

    // Calculate Interaccion Efectiva
    const effectiveInteraction = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Parse weekly report
    // In GA4 node client, if multiple date ranges are provided, rows have dimension values indicating the date range (date_range_0, date_range_1)
    // Wait, by default if no dimensions are requested, GA4 returns rows with `dimensionValues` for `dateRange` automatically.
    // Let's make sure. Alternatively, just send two separate requests.
    // Actually, GA4 API does add a "dateRange" dimension implicitly if multiple dateRanges are requested.
    // But it's safer to just do two reports or add dimension 'dateRange' just in case, but let's just parse it assuming order or just do two separate calls to be safe.
    
    // Let's do two separate calls for simplicity and reliability.
    const [thisWeekReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }], // 7 days total
      metrics: [{ name: 'totalUsers' }],
    });

    const [lastWeekReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '13daysAgo', endDate: '7daysAgo' }], // 7 days total
      metrics: [{ name: 'totalUsers' }],
    });

    const totalUsersThisWeek = parseInt(thisWeekReport.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
    const totalUsersLastWeek = parseInt(lastWeekReport.rows?.[0]?.metricValues?.[0]?.value || '0', 10);

    let weeklyGrowthRate = 0;
    if (totalUsersLastWeek > 0) {
      weeklyGrowthRate = ((totalUsersThisWeek - totalUsersLastWeek) / totalUsersLastWeek) * 100;
    } else if (totalUsersThisWeek > 0) {
      weeklyGrowthRate = 100;
    }

    return NextResponse.json({
      newUsers,
      bounceRate,
      activeUsers,
      totalUsers,
      effectiveInteraction,
      weeklyGrowthRate,
      totalUsersThisWeek,
      totalUsersLastWeek,
      dateRange: { startDate, endDate }
    });

  } catch (error: any) {
    console.error('Error fetching indicator data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch indicator data', details: error.message },
      { status: 500 }
    );
  }
}
