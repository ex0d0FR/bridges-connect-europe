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
    
    let allChurches: DiscoveredChurch[] = [];

    // 1. Google Maps Places Scraper
    try {
      console.log('Running Google Maps scraper...');
      const googleMapsResponse = await fetch(`https://api.apify.com/v2/acts/compass~google-maps-scraper/run-sync-get-dataset-items?token=${apifyApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: [`churches in ${location}`],
          maxItems: 50,
          language: 'en',
          region: 'us',
          extractEmails: true,
          extractWebsites: true,
        })
      });

      if (googleMapsResponse.ok) {
        const googleData = await googleMapsResponse.json();
        console.log(`Google Maps raw response:`, JSON.stringify(googleData, null, 2));
        console.log(`Google Maps found ${googleData.length} results`);
        
        if (googleData && Array.isArray(googleData) && googleData.length > 0) {
          const googleChurches = googleData
            .filter((place: any) => {
              const hasChurchInTitle = place.title && place.title.toLowerCase().includes('church');
              const hasChurchInCategory = place.categoryName && place.categoryName.toLowerCase().includes('church');
              return hasChurchInTitle || hasChurchInCategory;
            })
            .map((place: any) => ({
              name: place.title || place.name,
              address: place.address,
              city: extractCity(place.address, location),
              country: extractCountry(place.address, location),
              phone: place.phoneNumber || place.phone,
              email: place.email,
              website: place.website || place.url,
              denomination: extractDenomination(place.title || place.name, place.categoryName || ''),
              source: 'Google Maps'
            }));
          
          console.log(`Filtered Google churches: ${googleChurches.length}`);
          allChurches.push(...googleChurches);
        }
      } else {
        console.error('Google Maps API error:', googleMapsResponse.status, await googleMapsResponse.text());
      }
    } catch (error) {
      console.error('Google Maps scraper error:', error);
    }

    // 2. Web Content Crawler for church directories
    try {
      console.log('Running web crawler for church directories...');
      const crawlerResponse = await fetch(`https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${apifyApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [
            { url: `https://www.google.com/search?q=church+directory+${encodeURIComponent(location)}` },
            { url: `https://www.google.com/search?q=protestant+churches+${encodeURIComponent(location)}` },
            { url: `https://www.google.com/search?q=evangelical+churches+${encodeURIComponent(location)}` }
          ],
          maxRequestsPerCrawl: 20,
          pageFunction: `
            async function pageFunction(context) {
              const { request, page } = context;
              
              // Extract church information from various directory sites
              const churches = [];
              
              // Look for church listings
              const churchElements = await page.$$eval('div, article, section', elements => {
                return elements
                  .filter(el => {
                    const text = el.textContent || '';
                    return text.includes('Church') || text.includes('church');
                  })
                  .slice(0, 10)
                  .map(el => {
                    const text = el.textContent || '';
                    const nameMatch = text.match(/([A-Z][\\w\\s]+Church[\\w\\s]*)/);
                    if (nameMatch) {
                      return {
                        name: nameMatch[1].trim(),
                        text: text.substring(0, 500)
                      };
                    }
                    return null;
                  })
                  .filter(Boolean);
              });
              
              return { churches: churchElements };
            }
          `
        })
      });

      if (crawlerResponse.ok) {
        const crawlerData = await crawlerResponse.json();
        console.log(`Web crawler found ${crawlerData.length} results`);
        
        for (const result of crawlerData) {
          if (result.churches) {
            const webChurches = result.churches.map((church: any) => ({
              name: church.name,
              address: extractAddress(church.text),
              city: extractCity(church.text, location),
              country: extractCountry('', location),
              phone: extractPhone(church.text),
              email: extractEmail(church.text),
              website: extractWebsite(church.text),
              denomination: extractDenomination(church.name, church.text),
              source: 'Web Directory'
            }));
            
            allChurches.push(...webChurches);
          }
        }
      }
    } catch (error) {
      console.error('Web crawler error:', error);
    }

    // 3. Social Media Scraper (for church Facebook pages)
    try {
      console.log('Running social media scraper...');
      const socialResponse = await fetch(`https://api.apify.com/v2/acts/apify~facebook-pages-scraper/run-sync-get-dataset-items?token=${apifyApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [
            `https://www.facebook.com/search/pages/?q=church%20${encodeURIComponent(location)}`
          ],
          maxItems: 30
        })
      });

      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        console.log(`Social media scraper found ${socialData.length} results`);
        
        const socialChurches = socialData
          .filter((page: any) => page.name && page.name.toLowerCase().includes('church'))
          .map((page: any) => ({
            name: page.name,
            address: page.address,
            city: extractCity(page.address || '', location),
            country: extractCountry(page.address || '', location),
            phone: page.phone,
            email: page.email,
            website: page.website,
            denomination: extractDenomination(page.name, page.about || ''),
            source: 'Facebook'
          }));
        
        allChurches.push(...socialChurches);
      }
    } catch (error) {
      console.error('Social media scraper error:', error);
    }

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
  return text.includes('catholic') || 
         text.includes('notre dame') || 
         text.includes('st.') || 
         text.includes('saint') ||
         text.includes('parish');
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