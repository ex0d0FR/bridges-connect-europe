import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyApiKey) {
      throw new Error('Apify API key not configured');
    }

    console.log(`Starting church discovery for location: ${location}`);
    
    // Determine language and region based on location
    const { language, region, searchTerms } = getLocationSettings(location);
    console.log(`Using language: ${language}, region: ${region}, search terms: ${searchTerms.join(', ')}`);
    
    let allChurches: DiscoveredChurch[] = [];

    // 1. Google Maps Places Scraper - using correct actor name
    for (const searchTerm of searchTerms.slice(0, 1)) { // Test with just one term first
      try {
        console.log(`Running Google Maps scraper for: ${searchTerm}...`);
        
        // Start the actor run first
        const runResponse = await fetch(`https://api.apify.com/v2/acts/drobnikj~crawler-google-places/runs?token=${apifyApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchStringsArray: [`${searchTerm} ${location}`],
            maxCrawledPlacesPerSearch: 20,
            language: language,
            countryCode: region.toUpperCase(),
            includeHistogram: false,
            includeOpeningHours: false,
            includeReviews: false,
            maxReviews: 0,
            maxImages: 0
          })
        });

        if (!runResponse.ok) {
          const errorText = await runResponse.text();
          console.error(`Failed to start Google Maps actor: ${runResponse.status} ${errorText}`);
          continue;
        }

        const runData = await runResponse.json();
        const runId = runData.data.id;
        console.log(`Started Google Maps actor run: ${runId}`);

        // Wait for run to complete and get results
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          
          const statusResponse = await fetch(`https://api.apify.com/v2/acts/drobnikj~crawler-google-places/runs/${runId}?token=${apifyApiKey}`);
          const statusData = await statusResponse.json();
          
          if (statusData.data.status === 'SUCCEEDED') {
            // Get the dataset items
            const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${apifyApiKey}`);
            const googleData = await datasetResponse.json();
            
            console.log(`Google Maps found ${googleData.length} total results`);
            if (googleData.length > 0) {
              console.log(`Sample result:`, JSON.stringify(googleData[0], null, 2));
            }

            
            if (googleData && Array.isArray(googleData) && googleData.length > 0) {
              const googleChurches = googleData
                .filter((place: any) => {
                  const title = (place.title || place.name || '').toLowerCase();
                  const category = (place.categories || place.categoryName || place.category || []).toString().toLowerCase();
                  
                  // Multi-language church keywords
                  const churchKeywords = ['church', 'iglesia', 'église', 'chiesa', 'kirche', 'igreja', 'temple', 'templo', 'congregacion', 'congregação', 'assemblée', 'gemeinde', 'religious'];
                  
                  const isChurch = churchKeywords.some(keyword => 
                    title.includes(keyword) || category.includes(keyword)
                  );
                  
                  if (isChurch) {
                    console.log(`Found potential church: ${title} - Categories: ${category}`);
                  }
                  return isChurch;
                })
                .map((place: any) => ({
                  name: place.title || place.name,
                  address: place.address || place.location?.address,
                  city: extractCity(place.address || place.location?.address, location),
                  country: extractCountry(place.address || place.location?.address, location),
                  phone: place.phoneNumber || place.phone,
                  email: place.email,
                  website: place.website || place.url,
                  denomination: extractDenomination(place.title || place.name, (place.categories || []).join(' ')),
                  source: 'Google Maps'
                }));
              
              console.log(`Filtered Google churches: ${googleChurches.length}`);
              allChurches.push(...googleChurches);
            } else {
              console.log('No valid data received from Google Maps API');
            }
            break; // Exit the polling loop
          } else if (statusData.data.status === 'FAILED') {
            console.error('Google Maps actor run failed:', statusData.data.statusMessage);
            break;
          }
          
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          console.error('Google Maps actor run timed out');
        }
      } catch (error) {
        console.error(`Google Maps scraper error for ${searchTerm}:`, error);
      }
    }

    // Skip additional scrapers for now to focus on getting Google Maps working
    console.log('Skipping additional scrapers for testing - focusing on Google Maps only');

    // Remove duplicates based on name similarity
    const uniqueChurches = removeDuplicates(allChurches);
    
    // Filter out Catholic churches if requested
    let filteredChurches = uniqueChurches;
    if (filterNonCatholic) {
      filteredChurches = uniqueChurches.filter(church => !isCatholic(church));
    }

    console.log(`Discovery complete: ${filteredChurches.length} unique non-Catholic churches found`);

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
    return locationParts[locationParts.length - 1]?.trim() || 'France';
  }
  const parts = address.split(',');
  return parts[parts.length - 1]?.trim() || 'France';
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

function extractPhone(text: string): string | undefined {
  const phoneMatch = text.match(/[\+]?[1-9]?[\d\s\-\(\)]{8,15}/);
  return phoneMatch?.[0]?.trim();
}

function extractEmail(text: string): string | undefined {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch?.[0];
}

function extractWebsite(text: string): string | undefined {
  const websiteMatch = text.match(/https?:\/\/[^\s]+/);
  return websiteMatch?.[0];
}

function extractAddress(text: string): string | undefined {
  // Simple address extraction - look for street patterns
  const addressMatch = text.match(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/i);
  return addressMatch?.[0];
}

function isCatholic(church: DiscoveredChurch): boolean {
  const text = `${church.name} ${church.denomination || ''}`.toLowerCase();
  console.log(`Checking if Catholic: "${church.name}" - text: "${text}"`);
  
  // Multi-language Catholic keywords
  const catholicKeywords = [
    'catholic', 'católica', 'catholique', 'cattolica', 'katholische', 'católica',
    'notre dame', 'san ', 'santa ', 'saint ', 'santo ', 'sta. ', 'st. ',
    'parish', 'parroquia', 'paroisse', 'parrocchia', 'pfarrei', 'paróquia',
    'basilica', 'basílica', 'basilique', 'basilica', 'basilika',
    'cathedral', 'catedral', 'cathédrale', 'cattedrale', 'kathedrale'
  ];
  
  const isCatholicResult = catholicKeywords.some(keyword => text.includes(keyword));
  
  console.log(`Is Catholic: ${isCatholicResult}`);
  return isCatholicResult;
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