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

    const queryGa4 = (dimensionName: string, limit = 15) => analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: dimensionName }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit
    });

    // For coordinates, we need city and country pairs together, so we run a specific combo query
    const geoCoordsQuery = analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'city' }, { name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 150, 
    });

    const [
      [countryReport],
      [cityReport],
      [regionReport],
      [languageReport],
      [geoReport]
    ] = await Promise.all([
      queryGa4('country', 40),
      queryGa4('city', 40),
      queryGa4('region', 40),
      queryGa4('language', 20),
      geoCoordsQuery
    ]);

    const formatData = (report: any) => {
      const data = (report.rows || []).map((row: any) => ({
        name: row.dimensionValues?.[0]?.value || 'Desconocido',
        users: parseInt(row.metricValues?.[0]?.value || '0', 10)
      }));
      return data.filter((item: any) => item.name !== '(not set)' && item.name !== '(not provided)' && item.name !== 'Desconocido');
    }

    // Helper map to transform language codes "es-419" to readable strings
    const languageNames: Record<string, string> = {
      'es': 'Español (Genérico)',
      'es-419': 'Español (Latinoamérica)',
      'es-es': 'Español (España)',
      'es-co': 'Español (Colombia)',
      'es-mx': 'Español (México)',
      'es-ar': 'Español (Argentina)',
      'es-us': 'Español (EE.UU.)',
      'en': 'Inglés (Genérico)',
      'en-us': 'Inglés (EE.UU.)',
      'en-gb': 'Inglés (Reino Unido)',
      'pt': 'Portugués',
      'pt-br': 'Portugués (Brasil)',
      'fr': 'Francés',
      'it': 'Italiano',
      'de': 'Alemán'
    };

    const formattedLanguage = formatData(languageReport).map((item: any) => {
      const lowerCode = item.name.toLowerCase();
      // Si el código exacto existe devolvemos el texto legible, sino probamos extraer solo los primeros 2 digitos (ej. fr-ca -> fr -> Francés), sino devolvemos el crudo
      let niceName = languageNames[lowerCode];
      if (!niceName) {
         const baseCode = lowerCode.split('-')[0];
         niceName = languageNames[baseCode] ? `${languageNames[baseCode]} (${lowerCode})` : item.name;
      }
      return { ...item, name: niceName };
    });

    const formattedGeo = geoReport.rows?.map(row => {
      const city = row.dimensionValues?.[0]?.value || 'Unknown';
      const country = row.dimensionValues?.[1]?.value || 'Unknown';

      const geoMap: Record<string, { lat: number, lng: number }> = {
        'Bogota': { lat: 4.6097, lng: -74.0817 }, 'Bogotá': { lat: 4.6097, lng: -74.0817 }, 'Medellin': { lat: 6.2442, lng: -75.5812 }, 'Medellín': { lat: 6.2442, lng: -75.5812 }, 'Cali': { lat: 3.4516, lng: -76.5320 }, 'Barranquilla': { lat: 10.9685, lng: -74.7813 }, 'Bucaramanga': { lat: 7.1193, lng: -73.1227 }, 'Cartagena': { lat: 10.3910, lng: -75.4794 }, 'Pereira': { lat: 4.8087, lng: -75.6906 }, 'Manizales': { lat: 5.0689, lng: -75.5174 }, 'Santa Marta': { lat: 11.2408, lng: -74.1990 },
        'Mexico City': { lat: 19.4326, lng: -99.1332 }, 'Ciudad de Mexico': { lat: 19.4326, lng: -99.1332 }, 'Guadalajara': { lat: 20.6597, lng: -103.3496 }, 'Monterrey': { lat: 25.6866, lng: -100.3161 }, 'Puebla': { lat: 19.0414, lng: -98.2063 }, 'Tijuana': { lat: 32.5149, lng: -117.0382 }, 'Cancun': { lat: 21.1619, lng: -86.8515 },
        'Buenos Aires': { lat: -34.6037, lng: -58.3816 }, 'Santiago': { lat: -33.4489, lng: -70.6693 }, 'Lima': { lat: -12.0464, lng: -77.0428 }, 'Sao Paulo': { lat: -23.5505, lng: -46.6333 }, 'Quito': { lat: -0.1807, lng: -78.4678 }, 'Caracas': { lat: 10.4806, lng: -66.9036 },
        'New York': { lat: 40.7128, lng: -74.0060 }, 'Miami': { lat: 25.7617, lng: -80.1918 }, 'Los Angeles': { lat: 34.0522, lng: -118.2437 }, 'Chicago': { lat: 41.8781, lng: -87.6298 }, 'Houston': { lat: 29.7604, lng: -95.3698 }, 'Dallas': { lat: 32.7767, lng: -96.7970 }, 'Atlanta': { lat: 33.7490, lng: -84.3880 }, 'Washington': { lat: 38.9072, lng: -77.0369 }, 'San Francisco': { lat: 37.7749, lng: -122.4194 }, 'Orlando': { lat: 28.5383, lng: -81.3792 }, 'Las Vegas': { lat: 36.1699, lng: -115.1398 },
        'Madrid': { lat: 40.4168, lng: -3.7038 }, 'Barcelona': { lat: 41.3851, lng: 2.1734 }, 'London': { lat: 51.5074, lng: -0.1278 }, 'Paris': { lat: 48.8566, lng: 2.3522 },
      };

      const coords = geoMap[city] || geoMap[`${city} City`] || { lat: 0, lng: 0 };

      // Fallback pseudo-random for unknown cities in known countries so they appear on the map
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
      country: formatData(countryReport),
      city: formatData(cityReport),
      region: formatData(regionReport),
      language: formattedLanguage,
      geoOptions: formattedGeo
    });

  } catch (error: any) {
    console.error('Error fetching GA4 Demographics Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demographic data', details: error.message },
      { status: 500 }
    );
  }
}
