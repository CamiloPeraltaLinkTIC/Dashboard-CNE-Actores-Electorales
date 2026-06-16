import { NextResponse } from 'next/server';
import { analyticsDataClient } from '@/lib/ga';
import { differenceInDays, subDays, format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';


const propertyId = process.env.GA_PROPERTY_ID;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    let prevStartDateStr = '60daysAgo';
    let prevEndDateStr = '30daysAgo';
    let prevDateText = 'periodo anterior';

    try {
      const parsedStart = parseISO(startDate);
      const parsedEnd = parseISO(endDate);
      if (isValid(parsedStart) && isValid(parsedEnd)) {
        const daysDiff = differenceInDays(parsedEnd, parsedStart);
        // El periodo empieza el dia anterior a startDate
        const prevEnd = subDays(parsedStart, 1);
        const prevStart = subDays(prevEnd, daysDiff);
        
        prevStartDateStr = format(prevStart, 'yyyy-MM-dd');
        prevEndDateStr = format(prevEnd, 'yyyy-MM-dd');
        
        const formatStr = "dd MMM yyyy";
        prevDateText = `${format(prevStart, formatStr, { locale: es })} al ${format(prevEnd, formatStr, { locale: es })}`;
      }
    } catch (e) {
      console.log("Error parsing dates", e);
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA_PROPERTY_ID is not configured in environment variables' },
        { status: 500 }
      );
    }

    // 1. Fetch Traffic & Users Over Time
    const [trafficReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // 2. Fetch Totals / KPIs (Current Period)
    const [kpiReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'bounceRate' },
      ],
    });

    // 2.5 Fetch Totals / KPIs (Previous Period)
    const [prevKpiReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: prevStartDateStr, endDate: prevEndDateStr }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'bounceRate' },
      ],
    });

    // 3. Fetch Device Data
    const [deviceReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    });

    // 4. Fetch Pages Data (Top 50 to allow filtering)
    const [pagesReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 50,
    });

    // 5. Fetch Geographic Data (Heatmap)
    const [geoReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'city' }, { name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 100, // get up to 100 locations for the heatmap
    });

    // --- MAPPING DATA ---

    const formattedTraffic = trafficReport.rows?.map(row => {
      const dateStr = row.dimensionValues?.[0]?.value || '';
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}`
        : dateStr;

      return {
        date: formattedDate,
        users: parseInt(row.metricValues?.[0]?.value || '0', 10),
        sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    }) || [];

    const kpiRow = kpiReport.rows?.[0]?.metricValues || [];
    const prevKpiRow = prevKpiReport.rows?.[0]?.metricValues || [];

    const currentTotalU = parseFloat(kpiRow[0]?.value || '0');
    const prevTotalU = parseFloat(prevKpiRow[0]?.value || '0');
    
    const currentActiveU = parseFloat(kpiRow[1]?.value || '0');
    const prevActiveU = parseFloat(prevKpiRow[1]?.value || '0');
    
    const currentNewU = parseFloat(kpiRow[2]?.value || '0');
    const prevNewU = parseFloat(prevKpiRow[2]?.value || '0');
    
    const currentViews = parseFloat(kpiRow[3]?.value || '0');
    const prevViews = parseFloat(prevKpiRow[3]?.value || '0');
    
    const currentSessions = parseFloat(kpiRow[4]?.value || '0');
    const prevSessions = parseFloat(prevKpiRow[4]?.value || '0');
    
    const currentBounce = parseFloat(kpiRow[5]?.value || '0') * 100;
    const prevBounce = parseFloat(prevKpiRow[5]?.value || '0') * 100;

    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0 && curr === 0) return { change: "0.0%", trend: "neutral" };
      if (prev === 0) return { change: "+100%", trend: "up" };
      const changePercent = ((curr - prev) / prev) * 100;
      return { 
        change: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`, 
        trend: changePercent >= 0 ? "up" : "down" 
      };
    };

    const formatMetric = (curr: number, prev: number, title: string) => {
      const ch = calculateChange(curr, prev);
      return {
        value: curr.toString(),
        change: ch.change,
        trend: ch.trend,
        prevText: `${prev.toLocaleString("es-CO")} ${title} en el ${prevDateText}`
      };
    };

    const kpis = {
      totalUsers: formatMetric(currentTotalU, prevTotalU, 'total'),
      activeUsers: formatMetric(currentActiveU, prevActiveU, 'activos'),
      newUsers: formatMetric(currentNewU, prevNewU, 'nuevos'),
      views: formatMetric(currentViews, prevViews, 'vistas'),
      sessions: formatMetric(currentSessions, prevSessions, 'sesiones'),
      bounceRate: { 
        value: currentBounce.toFixed(2) + '%', 
        change: calculateChange(currentBounce, prevBounce).change, 
        trend: calculateChange(currentBounce, prevBounce).trend, 
        prevText: `${prevBounce.toFixed(2)}% de rebote en el ${prevDateText}` 
      },
    };

    const formattedDevices = deviceReport.rows?.map(row => {
      const category = row.dimensionValues?.[0]?.value || 'Unknown';
      const nameMap: Record<string, string> = {
        'desktop': 'Escritorio',
        'mobile': 'Móvil',
        'tablet': 'Tablet',
      };

      const palette = { primary: "#003893", secondary: "#FCD116", tertiary: "#CE1126", dark: "#0f172a" };
      let fillColor = palette.dark;
      if (nameMap[category.toLowerCase()] === 'Escritorio') fillColor = palette.primary;
      else if (nameMap[category.toLowerCase()] === 'Móvil') fillColor = palette.secondary;
      else if (nameMap[category.toLowerCase()] === 'Tablet') fillColor = palette.tertiary;

      return {
        name: nameMap[category.toLowerCase()] || category,
        value: parseInt(row.metricValues?.[0]?.value || '0', 10),
        fill: fillColor
      };
    }) || [];

    const formattedPages = (pagesReport.rows || [])
      .map(row => {
        const path = row.dimensionValues?.[0]?.value || '/';
        const title = row.dimensionValues?.[1]?.value || 'Sin Título';
        return {
          path: path,
          title: title,
          displayName: title,
          views: parseInt(row.metricValues?.[0]?.value || '0', 10),
          users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        };
      })
      .filter(page => !page.path.includes('/template/') && !page.path.includes('?bricks='))
      .slice(0, 5); // Tomamos solo el top 5 después de filtrar

    const formattedGeo = geoReport.rows?.map(row => {
      const city = row.dimensionValues?.[0]?.value || 'Unknown';
      const country = row.dimensionValues?.[1]?.value || 'Unknown';

      const geoMap: Record<string, { lat: number, lng: number }> = {
        // Colombia
        'Bogota': { lat: 4.6097, lng: -74.0817 }, 'Bogotá': { lat: 4.6097, lng: -74.0817 }, 'Medellin': { lat: 6.2442, lng: -75.5812 }, 'Medellín': { lat: 6.2442, lng: -75.5812 }, 'Cali': { lat: 3.4516, lng: -76.5320 }, 'Barranquilla': { lat: 10.9685, lng: -74.7813 }, 'Bucaramanga': { lat: 7.1193, lng: -73.1227 }, 'Cartagena': { lat: 10.3910, lng: -75.4794 }, 'Pereira': { lat: 4.8087, lng: -75.6906 }, 'Manizales': { lat: 5.0689, lng: -75.5174 }, 'Santa Marta': { lat: 11.2408, lng: -74.1990 },
        // Mexico
        'Mexico City': { lat: 19.4326, lng: -99.1332 }, 'Ciudad de Mexico': { lat: 19.4326, lng: -99.1332 }, 'Guadalajara': { lat: 20.6597, lng: -103.3496 }, 'Monterrey': { lat: 25.6866, lng: -100.3161 }, 'Puebla': { lat: 19.0414, lng: -98.2063 }, 'Tijuana': { lat: 32.5149, lng: -117.0382 }, 'Cancun': { lat: 21.1619, lng: -86.8515 },
        // LATAM
        'Buenos Aires': { lat: -34.6037, lng: -58.3816 }, 'Santiago': { lat: -33.4489, lng: -70.6693 }, 'Lima': { lat: -12.0464, lng: -77.0428 }, 'Sao Paulo': { lat: -23.5505, lng: -46.6333 }, 'Quito': { lat: -0.1807, lng: -78.4678 }, 'Caracas': { lat: 10.4806, lng: -66.9036 },
        // US
        'New York': { lat: 40.7128, lng: -74.0060 }, 'Miami': { lat: 25.7617, lng: -80.1918 }, 'Los Angeles': { lat: 34.0522, lng: -118.2437 }, 'Chicago': { lat: 41.8781, lng: -87.6298 }, 'Houston': { lat: 29.7604, lng: -95.3698 }, 'Dallas': { lat: 32.7767, lng: -96.7970 }, 'Atlanta': { lat: 33.7490, lng: -84.3880 }, 'Washington': { lat: 38.9072, lng: -77.0369 }, 'San Francisco': { lat: 37.7749, lng: -122.4194 }, 'Orlando': { lat: 28.5383, lng: -81.3792 }, 'Las Vegas': { lat: 36.1699, lng: -115.1398 },
        // Europe
        'Madrid': { lat: 40.4168, lng: -3.7038 }, 'Barcelona': { lat: 41.3851, lng: 2.1734 }, 'London': { lat: 51.5074, lng: -0.1278 }, 'Paris': { lat: 48.8566, lng: 2.3522 },
      };

      const coords = geoMap[city] || geoMap[`${city} City`] || { lat: 0, lng: 0 };

      // Fallback: Si no conocemos la ciudad, la mandaremos cerca del centro del país si es Colombia, Mexico o US para no perder el tráfico visualmente, con algo de jitter
      if (coords.lat === 0 && coords.lng === 0) {
        if (country === 'Colombia') return { city, lat: 4.6 + (Math.random() * 2 - 1), lng: -74.0 + (Math.random() * 2 - 1), weight: parseInt(row.metricValues?.[0]?.value || '0', 10) };
        if (country === 'Mexico') return { city, lat: 23.6345 + (Math.random() * 4 - 2), lng: -102.5528 + (Math.random() * 4 - 2), weight: parseInt(row.metricValues?.[0]?.value || '0', 10) };
        if (country === 'United States') return { city, lat: 37.0902 + (Math.random() * 10 - 5), lng: -95.7129 + (Math.random() * 10 - 5), weight: parseInt(row.metricValues?.[0]?.value || '0', 10) };
      }

      return {
        city: city,
        lat: coords.lat,
        lng: coords.lng,
        weight: parseInt(row.metricValues?.[0]?.value || '0', 10),
      };
    }).filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0) || [];

    return NextResponse.json({
      traffic: formattedTraffic,
      kpis,
      devices: formattedDevices,
      pages: formattedPages,
      geo: formattedGeo
    });

  } catch (error: any) {
    console.error('Error fetching GA4 data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    );
  }
}
