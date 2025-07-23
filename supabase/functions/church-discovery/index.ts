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

    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyApiKey) {
      throw new Error('Apify API key not configured');
    }

    console.log('APIFY_API_KEY available:', !!apifyApiKey);
    console.log(`Starting real data collection for: ${location}`);
    
    // Determine language and region based on location
    const { language, region, searchTerms } = getLocationSettings(location);
    console.log(`Using language: ${language}, region: ${region}, search terms: ${searchTerms.join(', ')}`);
    
    // Use Google Places scraper with a reliable actor
    for (const searchTerm of searchTerms.slice(0, 2)) { // Use first 2 search terms
      try {
        console.log(`Running Google Places scraper for: ${searchTerm}...`);
        
        const searchQuery = `${searchTerm} ${location}`;
        console.log(`Search query: ${searchQuery}`);
        
        // Use a sync endpoint for simpler handling
        const response = await fetch(`https://api.apify.com/v2/acts/nwua9Gu5YrADL7ZDj/run-sync-get-dataset-items?token=${apifyApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queries: [searchQuery],
            maxItems: 20,
            language: language,
            countryCode: region.toUpperCase(),
            includeImages: false,
            includeReviews: false
          })
        });

        console.log(`API Response Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Found ${data.length} total results for "${searchTerm}"`);
          
          if (data && Array.isArray(data) && data.length > 0) {
            console.log(`Sample result structure:`, JSON.stringify(data[0], null, 2));
            
            const churches = data
              .filter((place: any) => {
                const name = (place.name || place.title || '').toLowerCase();
                const category = (place.category || place.categories || []).toString().toLowerCase();
                
                // Multi-language church keywords
                const churchKeywords = ['church', 'iglesia', 'église', 'chiesa', 'kirche', 'igreja', 'temple', 'templo', 'congregacion', 'congregação', 'assemblée', 'gemeinde', 'chapel', 'capilla'];
                
                const isChurch = churchKeywords.some(keyword => 
                  name.includes(keyword) || category.includes(keyword)
                );
                
                if (isChurch) {
                  console.log(`Found church: ${name} - Category: ${category}`);
                }
                return isChurch;
              })
              .map((place: any) => ({
                name: place.name || place.title,
                address: place.address || place.location?.address,
                city: extractCity(place.address || place.location?.address, location),
                country: extractCountry(place.address || place.location?.address, location),
                phone: place.phone || place.phoneNumber,
                email: place.email,
                website: place.website || place.url,
                denomination: extractDenomination(place.name || place.title, (place.category || []).join(' ')),
                source: 'Google Places API'
              }));
            
            console.log(`Filtered churches for "${searchTerm}": ${churches.length}`);
            allChurches.push(...churches);
          }
        } else {
          const errorText = await response.text();
          console.error(`API error for "${searchTerm}": ${response.status} ${errorText}`);
        }
      } catch (error) {
        console.error(`Error processing "${searchTerm}":`, error);
      }
    }

    // Remove duplicates based on name similarity
    const uniqueChurches = removeDuplicates(allChurches);
    console.log(`After removing duplicates: ${uniqueChurches.length} churches`);
    
    // Filter out Catholic churches if requested
    let filteredChurches = uniqueChurches;
    if (filterNonCatholic) {
      filteredChurches = uniqueChurches.filter(church => !isCatholic(church));
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
function getLocationSettings(location: string): { language: string; region: string; searchTerms: string[] } {
  const locationLower = location.toLowerCase();
  
  // Determine language and region based on location
  if (locationLower.includes('spain') || locationLower.includes('españa') || locationLower.includes('madrid') || locationLower.includes('barcelona')) {
    return {
      language: 'es',
      region: 'es',
      searchTerms: ['iglesias', 'iglesia evangelica', 'iglesia protestante', 'templo', 'congregacion']
    };
  } else if (locationLower.includes('france') || locationLower.includes('paris') || locationLower.includes('lyon') || locationLower.includes('marseille')) {
    return {
      language: 'fr',
      region: 'fr',
      searchTerms: ['églises', 'église protestante', 'église évangélique', 'temple', 'assemblée']
    };
  } else if (locationLower.includes('italy') || locationLower.includes('italia') || locationLower.includes('rome') || locationLower.includes('milan')) {
    return {
      language: 'it',
      region: 'it',
      searchTerms: ['chiese', 'chiesa protestante', 'chiesa evangelica', 'tempio', 'congregazione']
    };
  } else if (locationLower.includes('germany') || locationLower.includes('deutschland') || locationLower.includes('berlin') || locationLower.includes('munich')) {
    return {
      language: 'de',
      region: 'de',
      searchTerms: ['kirchen', 'evangelische kirche', 'protestantische kirche', 'freikirche', 'gemeinde']
    };
  } else if (locationLower.includes('portugal') || locationLower.includes('lisbon') || locationLower.includes('porto')) {
    return {
      language: 'pt',
      region: 'pt',
      searchTerms: ['igrejas', 'igreja protestante', 'igreja evangélica', 'templo', 'congregação']
    };
  } else {
    // Default to English
    return {
      language: 'en',
      region: 'us',
      searchTerms: ['churches', 'protestant churches', 'evangelical churches', 'baptist churches', 'methodist churches']
    };
  }
}

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

function extractDenomination(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.includes('baptist')) return 'Baptist';
  if (text.includes('methodist')) return 'Methodist';
  if (text.includes('presbyterian')) return 'Presbyterian';
  if (text.includes('pentecostal')) return 'Pentecostal';
  if (text.includes('evangelical')) return 'Evangelical';
  if (text.includes('lutheran')) return 'Lutheran';
  if (text.includes('anglican')) return 'Anglican';
  if (text.includes('reformed')) return 'Reformed';
  if (text.includes('assemblies of god')) return 'Assemblies of God';
  if (text.includes('seventh-day adventist')) return 'Seventh-day Adventist';
  
  return 'Other Protestant';
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

function removeDuplicates(churches: DiscoveredChurch[]): DiscoveredChurch[] {
  const seen = new Set<string>();
  return churches.filter(church => {
    const key = church.name.toLowerCase().replace(/[^a-z]/g, '');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

serve(handler);