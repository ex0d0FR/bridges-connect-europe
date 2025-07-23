import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChurchDiscoveryRequest {
  location: string;
  filterNonCatholic?: boolean;
}

interface DiscoveredChurch {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  denomination?: string;
  source: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, filterNonCatholic = true }: ChurchDiscoveryRequest = await req.json();
    
    console.log(`Starting church discovery for location: ${location}`);
    
    let allChurches: DiscoveredChurch[] = [];

    // For testing, provide mock data for different locations
    const locationLower = location.toLowerCase();
    
    if (locationLower.includes('madrid')) {
      allChurches = [
        {
          name: 'Iglesia Evangélica Bautista de Madrid',
          address: 'Calle Alcalá 123, Madrid',
          city: 'Madrid',
          country: 'Spain',
          phone: '+34 91 123 4567',
          denomination: 'Baptist',
          source: 'Test Data'
        },
        {
          name: 'Centro Cristiano Vida Nueva',
          address: 'Gran Vía 456, Madrid',
          city: 'Madrid', 
          country: 'Spain',
          phone: '+34 91 765 4321',
          denomination: 'Evangelical',
          source: 'Test Data'
        },
        {
          name: 'Iglesia Metodista Unida',
          address: 'Calle Serrano 89, Madrid',
          city: 'Madrid',
          country: 'Spain',
          phone: '+34 91 555 0123',
          denomination: 'Methodist',
          source: 'Test Data'
        }
      ];
      console.log('Added test churches for Madrid:', allChurches.length);
    } else if (locationLower.includes('valencia')) {
      allChurches = [
        {
          name: 'Iglesia Protestante de Valencia',
          address: 'Plaza del Ayuntamiento 15, Valencia',
          city: 'Valencia',
          country: 'Spain',
          phone: '+34 96 123 4567',
          denomination: 'Protestant',
          source: 'Test Data'
        },
        {
          name: 'Centro Evangélico Betesda',
          address: 'Avenida del Puerto 234, Valencia',
          city: 'Valencia',
          country: 'Spain',
          phone: '+34 96 987 6543',
          denomination: 'Evangelical',
          source: 'Test Data'
        }
      ];
      console.log('Added test churches for Valencia:', allChurches.length);
    } else if (locationLower.includes('guatemala')) {
      allChurches = [
        {
          name: 'Iglesia Evangélica Nacional Presbiteriana de Guatemala',
          address: 'Zona 1, Ciudad de Guatemala',
          city: 'Guatemala City',
          country: 'Guatemala',
          phone: '+502 2251 4567',
          denomination: 'Presbyterian',
          source: 'Test Data'
        },
        {
          name: 'Iglesia del Nazareno Central',
          address: 'Zona 10, Ciudad de Guatemala',
          city: 'Guatemala City',
          country: 'Guatemala',
          phone: '+502 2367 8901',
          denomination: 'Nazarene',
          source: 'Test Data'
        }
      ];
      console.log('Added test churches for Guatemala:', allChurches.length);
    } else if (locationLower.includes('miami') || locationLower.includes('usa')) {
      allChurches = [
        {
          name: 'First Baptist Church of Miami',
          address: '5400 NW 22nd Ave, Miami, FL',
          city: 'Miami',
          country: 'USA',
          phone: '+1 305 635 6621',
          denomination: 'Baptist',
          source: 'Test Data'
        },
        {
          name: 'Calvary Chapel Miami',
          address: '14100 Biscayne Blvd, North Miami Beach, FL',
          city: 'Miami',
          country: 'USA',
          phone: '+1 305 895 8050',
          denomination: 'Calvary Chapel',
          source: 'Test Data'
        },
        {
          name: 'Miami Vineyard Community Church',
          address: '2500 SW 75th Ave, Miami, FL',
          city: 'Miami',
          country: 'USA',
          phone: '+1 305 261 0849',
          denomination: 'Vineyard',
          source: 'Test Data'
        }
      ];
      console.log('Added test churches for Miami:', allChurches.length);
    } else {
      // Default churches for any other location
      allChurches = [
        {
          name: 'Community Christian Church',
          address: 'Main Street 100',
          city: extractCity('', location),
          country: extractCountry('', location),
          phone: 'Contact for details',
          denomination: 'Non-denominational',
          source: 'Test Data'
        },
        {
          name: 'Grace Baptist Church',
          address: 'Church Avenue 250',
          city: extractCity('', location),
          country: extractCountry('', location),
          phone: 'Contact for details',
          denomination: 'Baptist',
          source: 'Test Data'
        }
      ];
      console.log('Added default test churches:', allChurches.length);
    }

    // Filter out Catholic churches if requested
    let filteredChurches = allChurches;
    if (filterNonCatholic) {
      filteredChurches = allChurches.filter(church => !isCatholic(church));
      console.log(`After filtering Catholics: ${filteredChurches.length} churches`);
    }

    console.log(`Discovery complete: ${filteredChurches.length} churches found for ${location}`);

    return new Response(JSON.stringify({ 
      churches: filteredChurches,
      total: filteredChurches.length,
      location 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in church-discovery function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Helper functions
function extractCity(address: string, location: string): string {
  if (!address) return location.split(',')[0].trim();
  const parts = address.split(',');
  return parts[parts.length - 2]?.trim() || location.split(',')[0].trim();
}

function extractCountry(address: string, location: string): string {
  if (!address) {
    const locationParts = location.split(',');
    return locationParts[locationParts.length - 1]?.trim() || 'Unknown';
  }
  const parts = address.split(',');
  return parts[parts.length - 1]?.trim() || 'Unknown';
}

function isCatholic(church: DiscoveredChurch): boolean {
  const text = `${church.name} ${church.denomination || ''}`.toLowerCase();
  
  // Multi-language Catholic keywords
  const catholicKeywords = [
    'catholic', 'católica', 'catholique', 'cattolica', 'katholische', 'católica',
    'notre dame', 'san ', 'santa ', 'saint ', 'santo ', 'sta. ', 'st. ',
    'parish', 'parroquia', 'paroisse', 'parrocchia', 'pfarrei', 'paróquia',
    'basilica', 'basílica', 'basilique', 'basilica', 'basilika',
    'cathedral', 'catedral', 'cathédrale', 'cattedrale', 'kathedrale'
  ];
  
  return catholicKeywords.some(keyword => text.includes(keyword));
}

serve(handler);