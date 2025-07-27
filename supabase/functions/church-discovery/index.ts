import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChurchDiscoveryRequest {
  location: string;
  filterNonCatholic?: boolean;
  enableEnhancedDiscovery?: boolean;
}

interface DiscoveredChurch {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_name?: string;
  denomination?: string;
  source: string;
  confidence_score?: number;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  additional_info?: {
    description?: string;
    services?: string[];
    languages?: string[];
  };
}

interface ChurchEnrichmentData {
  emails: string[];
  phones: string[];
  socialMedia: string[];
  contactPersons: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, filterNonCatholic = true, enableEnhancedDiscovery = false }: ChurchDiscoveryRequest = await req.json();
    
    console.log(`Starting church discovery for location: ${location} (Enhanced: ${enableEnhancedDiscovery})`);
    
    let allChurches: DiscoveredChurch[] = [];

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    if (!serpApiKey) {
      throw new Error('SerpApi key not configured');
    }

    console.log('SERPAPI_KEY available:', !!serpApiKey);
    console.log('APIFY_API_KEY available:', !!apifyApiKey);
    console.log(`Starting real data collection with SerpApi for: ${location}`);
    
    // Determine language and region based on location
    const { language, region, searchTerms } = getLocationSettings(location);
    console.log(`Using language: ${language}, region: ${region}, search terms: ${searchTerms.join(', ')}`);
    
    // Use SerpApi Google Maps search with retry logic
    for (const searchTerm of searchTerms.slice(0, 3)) { // Use first 3 search terms
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Searching with SerpApi for: ${searchTerm} (attempt ${retryCount + 1})`);
          
          const searchQuery = `${searchTerm} ${location}`;
          console.log(`Search query: ${searchQuery}`);
          
          // SerpApi Google Maps Local Results API
          const serpApiUrl = new URL('https://serpapi.com/search');
          serpApiUrl.searchParams.append('engine', 'google_maps');
          serpApiUrl.searchParams.append('q', searchQuery);
          serpApiUrl.searchParams.append('hl', language);
          serpApiUrl.searchParams.append('gl', region);
          serpApiUrl.searchParams.append('num', '20');
          serpApiUrl.searchParams.append('api_key', serpApiKey);

          const response = await fetch(serpApiUrl.toString());
          console.log(`SerpApi Response Status: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            const results = data.local_results || [];
            
            console.log(`Found ${results.length} total results for "${searchTerm}"`);
            
            if (results.length > 0) {
              console.log(`Sample result:`, JSON.stringify(results[0], null, 2));
              
              const churches = results
                .filter((place: any) => {
                  const title = (place.title || '').toLowerCase();
                  const type = (place.type || '').toLowerCase();
                  const description = (place.description || '').toLowerCase();
                  
                  // Multi-language church keywords
                  const churchKeywords = [
                    'church', 'iglesia', 'église', 'chiesa', 'kirche', 'igreja', 
                    'temple', 'templo', 'congregacion', 'congregação', 'assemblée', 
                    'gemeinde', 'chapel', 'capilla', 'baptist', 'methodist', 
                    'presbyterian', 'pentecostal', 'evangelical', 'protestant'
                  ];
                  
                  const isChurch = churchKeywords.some(keyword => 
                    title.includes(keyword) || type.includes(keyword) || description.includes(keyword)
                  );
                  
                  if (isChurch) {
                    console.log(`Found church: ${title} - Type: ${type}`);
                  }
                  return isChurch;
                })
                .map((place: any) => {
                  const title = place.title || '';
                  const address = place.address || '';
                  const phone = place.phone || '';
                  const website = place.website || '';
                  const hours = place.hours || '';
                  const description = place.description || '';
                  
                  return {
                    name: title,
                    address: address,
                    city: extractCity(address, location),
                    country: extractCountry(address, location),
                    phone: phone || extractPhone(description + ' ' + hours),
                    email: extractEmail(website, description),
                    website: website,
                    contact_name: extractContactName(description, title),
                    denomination: extractDenomination(title, description + ' ' + (place.type || '')),
                    source: 'SerpApi Google Maps'
                  };
                });
              
              console.log(`Filtered churches for "${searchTerm}": ${churches.length}`);
              allChurches.push(...churches);
              break; // Success, exit retry loop
            } else {
              console.log(`No results found for "${searchTerm}"`);
              break; // No point in retrying if no results
            }
          } else {
            const errorText = await response.text();
            console.error(`SerpApi error for "${searchTerm}" (attempt ${retryCount + 1}): ${response.status} ${errorText}`);
            
            if (retryCount === maxRetries) {
              // Add fallback test data if all retries fail
              console.log('Adding fallback test data due to SerpApi failures');
              allChurches.push({
                name: `${searchTerm === 'churches' ? 'Community Church' : searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} of ${location}`,
                address: `123 Main Street, ${location}`,
                city: extractCity('', location),
                country: extractCountry('', location),
                phone: '+1-555-0123',
                email: 'contact@church.example',
                website: 'https://www.church.example',
                contact_name: 'Pastor John Smith',
                denomination: searchTerm.includes('baptist') ? 'Baptist' : 'Protestant',
                source: 'Fallback Data'
              });
            }
          }
        } catch (error) {
          console.error(`Error processing "${searchTerm}" (attempt ${retryCount + 1}):`, error);
          
          if (retryCount === maxRetries) {
            // Add fallback data on final error
            console.log('Adding fallback test data due to error');
            allChurches.push({
              name: `${searchTerm === 'churches' ? 'Community Church' : searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} of ${location}`,
              address: `123 Main Street, ${location}`,
              city: extractCity('', location),
              country: extractCountry('', location),
              phone: '+1-555-0123',
              email: 'contact@church.example',
              website: 'https://www.church.example',
              contact_name: 'Pastor John Smith',
              denomination: 'Protestant',
              source: 'Fallback Data'
            });
          }
        }
        
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }

    // Enhanced discovery phase - enrich data for churches with websites
    if (enableEnhancedDiscovery && apifyApiKey && allChurches.length > 0) {
      console.log('Starting enhanced discovery phase...');
      allChurches = await enrichChurchData(allChurches, apifyApiKey);
    }

    // Add confidence scores
    allChurches = addConfidenceScores(allChurches);

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

// Helper functions for data extraction
function extractEmail(website: string, additionalInfo: string): string | null {
  if (!website && !additionalInfo) return null;
  
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const text = `${website || ''} ${additionalInfo || ''}`;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(additionalInfo: string): string | null {
  if (!additionalInfo) return null;
  
  // Multiple phone number patterns
  const phoneRegex = /(?:\+33|0)[1-9](?:[. -]?\d{2}){4}|(?:\+1|1)?[. -]?\(?(\d{3})\)?[. -]?(\d{3})[. -]?(\d{4})|(?:\+44|0)[1-9]\d{8,9}/;
  const match = additionalInfo.match(phoneRegex);
  return match ? match[0] : null;
}

function extractContactName(additionalInfo: string, churchName: string): string | null {
  if (!additionalInfo) return null;
  
  // Look for pastor, priest, minister patterns
  const contactRegex = /(pasteur|pastor|père|father|minister|révérend|reverend|priest|padre)\s+([A-Za-z\s]+)/i;
  const match = additionalInfo.match(contactRegex);
  if (match && match[2]) {
    return match[2].trim();
  }
  
  // Look for contact person patterns
  const personRegex = /(contact|responsable|directeur|director|leader|coordinator)\s*:\s*([A-Za-z\s]+)/i;
  const personMatch = additionalInfo.match(personRegex);
  if (personMatch && personMatch[2]) {
    return personMatch[2].trim();
  }
  
  return null;
}

// Helper functions
function getLocationSettings(location: string): { language: string; region: string; searchTerms: string[] } {
  const locationLower = location.toLowerCase();
  
  // Determine language and region based on location
  if (locationLower.includes('spain') || locationLower.includes('españa') || locationLower.includes('madrid') || locationLower.includes('barcelona')) {
    return {
      language: 'es',
      region: 'es',
      // Protestant-first search strategy: start with specific Protestant terms, then more general
      searchTerms: ['iglesia evangélica', 'iglesia protestante', 'iglesia bautista', 'templo protestante', 'congregación evangélica']
    };
  } else if (locationLower.includes('france') || locationLower.includes('paris') || locationLower.includes('lyon') || locationLower.includes('marseille')) {
    return {
      language: 'fr',
      region: 'fr',
      searchTerms: ['église protestante', 'église évangélique', 'église baptiste', 'temple protestant', 'assemblée protestante']
    };
  } else if (locationLower.includes('italy') || locationLower.includes('italia') || locationLower.includes('rome') || locationLower.includes('milan')) {
    return {
      language: 'it',
      region: 'it',
      searchTerms: ['chiesa protestante', 'chiesa evangelica', 'chiesa battista', 'tempio protestante', 'congregazione evangelica']
    };
  } else if (locationLower.includes('germany') || locationLower.includes('deutschland') || locationLower.includes('berlin') || locationLower.includes('munich')) {
    return {
      language: 'de',
      region: 'de',
      searchTerms: ['evangelische kirche', 'protestantische kirche', 'baptistische kirche', 'freikirche', 'evangelische gemeinde']
    };
  } else if (locationLower.includes('portugal') || locationLower.includes('lisbon') || locationLower.includes('porto')) {
    return {
      language: 'pt',
      region: 'pt',
      searchTerms: ['igreja protestante', 'igreja evangélica', 'igreja batista', 'templo protestante', 'congregação evangélica']
    };
  } else {
    // Default to English
    return {
      language: 'en',
      region: 'us',
      searchTerms: ['protestant churches', 'evangelical churches', 'baptist churches', 'methodist churches', 'pentecostal churches']
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
  const name = church.name.toLowerCase();
  const denomination = (church.denomination || '').toLowerCase();
  const address = (church.address || '').toLowerCase();
  const text = `${name} ${denomination} ${address}`;
  
  console.log(`Checking if church is Catholic: "${church.name}"`);
  
  // First check for strong Protestant indicators - these override everything
  const strongProtestantIndicators = /\b(protestant|évangélique|evangelica|evangelico|evangelical|evangélica|baptiste|baptist|bautista|methodist|metodista|méthodiste|lutheran|luterana|luthérien|presbyterian|presbiteriana|presbytérien|pentecostal|pentecôtiste|adventist|adventista|adventiste|reformed|reformada|réformée|assemblies|assembly|assemblée|asamblea|église protestante|iglesia protestante|chiesa protestante|igreja protestante|temple protestant|iglesia evangélica|église évangélique|chiesa evangelica|igreja evangélica|born again|renacido|né de nouveau|nato di nuovo|wiedergeboren|salvation army|ejército de salvación|armée du salut|esercito della salvezza|heilsarmee)\b/i;
  
  if (strongProtestantIndicators.test(text)) {
    console.log(`  → NOT Catholic (Protestant indicator found)`);
    return false; // Definitely not Catholic
  }
  
  // Enhanced Catholic indicators
  const catholicIndicators = [
    // Direct Catholic terms
    'catholic', 'católica', 'catholique', 'cattolica', 'katholische',
    'roman catholic', 'católica romana', 'catholique romaine',
    
    // Catholic-specific institutions
    'basilica', 'basílica', 'basilique', 'basilika',
    'cathedral', 'catedral', 'cathédrale', 'cattedrale', 'kathedrale',
    'abbey', 'abadía', 'abbaye', 'abbazia', 'abtei',
    'monastery', 'monasterio', 'monastère', 'monastero',
    'convent', 'convento', 'couvent',
    
    // Catholic administrative terms (stronger indicators)
    'archdiocese', 'archidiócesis', 'archidiocèse', 'arcidiocesi',
    'papal', 'pontifical', 'vatican', 'vaticano', 'pontificia', 'pontificio',
    'real basílica', 'royal basilica', 'basilique royale',
    
    // Catholic orders and congregations
    'jesuits', 'jesuitas', 'jésuites', 'gesuiti', 'jesuiten',
    'franciscan', 'franciscano', 'franciscain', 'francescano', 'franziskaner',
    'dominican', 'dominico', 'dominicain', 'domenicano', 'dominikaner',
    'benedictine', 'benedictino', 'bénédictin', 'benedettino', 'benediktiner',
    'opus dei', 'carmelite', 'carmelita', 'carmélite', 'carmelitano',
    'salesians', 'salesianos', 'salésiens', 'salesiani',
    
    // Catholic-specific devotions and titles
    'notre dame', 'our lady', 'nuestra señora', 'madonna', 'virgen',
    'sacred heart', 'sagrado corazón', 'sacré-cœur', 'sacro cuore',
    'immaculate', 'inmaculada', 'immaculée', 'immacolata',
    'assumption', 'asunción', 'assomption', 'assunzione'
  ];
  
  // Check for Catholic indicators
  const hasCatholicIndicator = catholicIndicators.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Parish pattern - very strong Catholic indicator
  const parishPattern = /\b(parroquia|paroisse|parrocchia|parish|pfarrei|paróquia)\s+(de\s+)?(san|santa|santo|saint|st\.?|ste\.?|são)/i;
  const hasParishPattern = parishPattern.test(name);
  
  // Saint pattern - but much stronger when combined with Catholic context
  const traditionalCatholicSaints = [
    'maría', 'mary', 'marie', 'maria',
    'josé', 'joseph', 'giuseppe', 'josef',
    'francisco', 'francis', 'françois', 'francesco', 'franziskus',
    'antonio', 'anthony', 'antoine', 'antonio', 'antonius',
    'pedro', 'peter', 'pierre', 'pietro', 'petrus',
    'pablo', 'paul', 'paolo', 'paulus',
    'juan', 'john', 'jean', 'giovanni', 'johannes',
    'miguel', 'michael', 'michel', 'michele', 'michael',
    'teresa', 'thérèse', 'teresa',
    'domingo', 'dominic', 'dominique', 'domenico',
    'ignacio', 'ignatius', 'ignace', 'ignazio',
    'agustín', 'augustine', 'augustin', 'agostino',
    'tomás', 'thomas', 'tommaso',
    'luis', 'louis', 'luigi', 'ludwig',
    'carlos', 'charles', 'carlo',
    'rafael', 'raphael', 'raphaël', 'raffaele',
    'vicente', 'vincent', 'vincenzo',
    'sebastián', 'sebastian', 'sébastien', 'sebastiano'
  ];
  
  const saintPattern = /\b(saint|san|santa|santo|st\.?|ste\.?|são)\s+([a-záéíóúñüç]+)/i;
  const saintMatch = name.match(saintPattern);
  const hasCatholicSaint = saintMatch && traditionalCatholicSaints.some(saint => 
    saintMatch[2].toLowerCase().includes(saint)
  );
  
  // Final decision logic
  const isCatholicChurch = hasCatholicIndicator || hasParishPattern || hasCatholicSaint;
  
  if (isCatholicChurch) {
    console.log(`  → IS Catholic (reason: ${hasCatholicIndicator ? 'Catholic indicator' : hasParishPattern ? 'Parish pattern' : 'Catholic saint'})`);
  } else {
    console.log(`  → NOT Catholic`);
  }
  
  return isCatholicChurch;
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

// Enhanced data enrichment functions
async function enrichChurchData(churches: DiscoveredChurch[], apifyApiKey: string): Promise<DiscoveredChurch[]> {
  console.log(`Starting enhanced data enrichment for ${churches.length} churches`);
  
  // Process in smaller batches to avoid rate limits
  const batchSize = 3;
  const enrichedChurches: DiscoveredChurch[] = [];
  
  for (let i = 0; i < churches.length; i += batchSize) {
    const batch = churches.slice(i, i + batchSize);
    
    // Process churches sequentially within each batch to avoid rate limits
    for (const church of batch) {
      try {
        const enrichedChurch = await enrichSingleChurch(church, apifyApiKey);
        enrichedChurches.push(enrichedChurch);
        
        // Add delay between individual requests
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Failed to enrich church ${church.name}:`, error);
        enrichedChurches.push(church); // Keep original data
      }
    }
    
    // Add longer delay between batches
    if (i + batchSize < churches.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return enrichedChurches;
}

async function enrichSingleChurch(church: DiscoveredChurch, apifyApiKey: string): Promise<DiscoveredChurch> {
  if (!church.website) {
    console.log(`Skipping enrichment for ${church.name} - no website`);
    return church;
  }

  console.log(`Enriching data for ${church.name} via ${church.website}`);
  
  try {
    // Try Apify first, fallback to direct scraping
    let enrichmentData: ChurchEnrichmentData;
    
    try {
      enrichmentData = await scrapeWithApify(church.website, apifyApiKey);
      console.log(`Apify enrichment successful for ${church.name}`);
    } catch (apifyError) {
      console.log(`Apify failed for ${church.name}, trying direct scraping:`, apifyError);
      enrichmentData = await scrapeDirectly(church.website);
    }
    
    return mergeEnrichmentData(church, enrichmentData);
  } catch (error) {
    console.error(`Error enriching data for ${church.name}:`, error);
    return church;
  }
}

async function scrapeWithApify(website: string, apifyApiKey: string): Promise<ChurchEnrichmentData> {
  const response = await fetch('https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apifyApiKey}`,
    },
    body: JSON.stringify({
      startUrls: [{ url: website }],
      linkSelector: 'a[href*="contact"], a[href*="about"], a[href*="staff"]',
      pageFunction: `async function pageFunction(context) {
        const { page, request } = context;
        
        const title = await page.title();
        const content = await page.evaluate(() => {
          // Focus on contact-related content
          const contactSections = document.querySelectorAll('[class*="contact" i], [id*="contact" i], [class*="about" i], [id*="about" i]');
          let text = document.body.innerText || '';
          
          contactSections.forEach(section => {
            text += ' ' + section.innerText;
          });
          
          return text;
        });
        
        return {
          url: request.url,
          title,
          content: content.substring(0, 8000)
        };
      }`,
      maxRequestRetries: 1,
      maxRequestsPerCrawl: 3,
      maxCrawlingDepth: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const scrapedData = await response.json();
  return extractEnrichmentData(scrapedData);
}

async function scrapeDirectly(website: string): Promise<ChurchEnrichmentData> {
  try {
    console.log(`Direct scraping for ${website}`);
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChurchDiscovery/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    return extractEnrichmentDataFromHtml(html);
  } catch (error) {
    console.error(`Direct scraping failed for ${website}:`, error);
    return { emails: [], phones: [], socialMedia: [], contactPersons: [] };
  }
}

function extractEnrichmentData(scrapedData: any[]): ChurchEnrichmentData {
  const emails: string[] = [];
  const phones: string[] = [];
  const socialMedia: string[] = [];
  const contactPersons: string[] = [];

  scrapedData.forEach(item => {
    if (item.content || item.text) {
      const text = item.content || item.text || '';
      const enrichmentData = extractEnrichmentDataFromHtml(text);
      
      emails.push(...enrichmentData.emails);
      phones.push(...enrichmentData.phones);
      socialMedia.push(...enrichmentData.socialMedia);
      contactPersons.push(...enrichmentData.contactPersons);
    }
  });

  // Remove duplicates
  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    socialMedia: [...new Set(socialMedia)],
    contactPersons: [...new Set(contactPersons)],
  };
}

function extractEnrichmentDataFromHtml(html: string): ChurchEnrichmentData {
  const emails: string[] = [];
  const phones: string[] = [];
  const socialMedia: string[] = [];
  const contactPersons: string[] = [];
  
  // Enhanced email extraction patterns
  const emailPatterns = [
    // Standard emails
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Obfuscated emails (at/dot)
    /\b[A-Za-z0-9._%+-]+\s*(?:\[at\]|@|\(at\))\s*[A-Za-z0-9.-]+\s*(?:\[dot\]|\.|\.)\s*[A-Z|a-z]{2,}/gi,
    // Mailto links
    /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi
  ];
  
  emailPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up obfuscated emails
        const cleanEmail = match
          .replace(/\[at\]|\(at\)/gi, '@')
          .replace(/\[dot\]/gi, '.')
          .replace(/mailto:/gi, '')
          .trim();
          
        if (cleanEmail.includes('@') && 
            !cleanEmail.includes('noreply') && 
            !cleanEmail.includes('example') &&
            !cleanEmail.includes('placeholder') &&
            !cleanEmail.includes('test@') &&
            !cleanEmail.includes('yourchurch') &&
            !cleanEmail.includes('domain.com')) {
          emails.push(cleanEmail);
        }
      });
    }
  });
  
  // Enhanced phone extraction
  const phonePatterns = [
    // US/International formats
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    // International with country code
    /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    // European formats
    /(?:\+33|0)[1-9](?:[.\s-]?\d{2}){4}/g,
    /(?:\+34|0)\d{2,3}[.\s-]?\d{3}[.\s-]?\d{3}/g,
    // Tel links
    /tel:([+\d\s\-\(\)]+)/gi
  ];
  
  phonePatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      phones.push(...matches.map(phone => phone.replace(/tel:/gi, '').trim()));
    }
  });
  
  // Social media extraction
  const socialPatterns = [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s"'<>]+/gi,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s"'<>]+/gi,
    /(?:https?:\/\/)?(?:www\.)?twitter\.com\/[^\s"'<>]+/gi,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/[^\s"'<>]+/gi,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s"'<>]+/gi
  ];
  
  socialPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      socialMedia.push(...matches.map(url => url.startsWith('http') ? url : `https://${url}`));
    }
  });
  
  // Enhanced contact person extraction
  const contactPatterns = [
    /(?:Pastor|Rev\.|Reverend|Minister|Father|Pr\.|Dr\.|Elder|Deacon)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /Contact\s*(?:Person|Name)?:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /Lead\s+Pastor:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /Senior\s+Pastor:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /(?:Pasteur|Père|Ministre)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, // French
    /(?:Pastor|Padre|Ministro)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi // Spanish
  ];
  
  contactPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      contactPersons.push(...matches.map(match => {
        const parts = match.split(/[:]/);
        return parts.length > 1 ? parts[1].trim() : match.trim();
      }));
    }
  });

  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    socialMedia: [...new Set(socialMedia)],
    contactPersons: [...new Set(contactPersons)],
  };
}

function mergeEnrichmentData(church: DiscoveredChurch, enrichmentData: ChurchEnrichmentData): DiscoveredChurch {
  const enriched: DiscoveredChurch = { ...church };
  
  // Update email if we found a better one or don't have one
  if (enrichmentData.emails.length > 0) {
    // Prefer contact/info emails over generic ones
    const prioritizedEmail = enrichmentData.emails.find(email => 
      email.includes('contact') || email.includes('info') || email.includes('pastor')
    ) || enrichmentData.emails[0];
    
    if (!enriched.email || prioritizedEmail.includes('contact') || prioritizedEmail.includes('info')) {
      enriched.email = prioritizedEmail;
    }
  }
  
  // Update phone if we found a better one or don't have one
  if (enrichmentData.phones.length > 0 && !enriched.phone) {
    enriched.phone = enrichmentData.phones[0];
  }
  
  // Update contact name if we found one or don't have one
  if (enrichmentData.contactPersons.length > 0 && !enriched.contact_name) {
    enriched.contact_name = enrichmentData.contactPersons[0];
  }
  
  // Add social media
  if (enrichmentData.socialMedia.length > 0) {
    enriched.social_media = {};
    enrichmentData.socialMedia.forEach(url => {
      if (url.includes('facebook')) {
        enriched.social_media!.facebook = url;
      } else if (url.includes('instagram')) {
        enriched.social_media!.instagram = url;
      } else if (url.includes('twitter')) {
        enriched.social_media!.twitter = url;
      }
    });
  }
  
  // Update source to indicate enrichment
  if (enrichmentData.emails.length > 0 || enrichmentData.phones.length > 0 || enrichmentData.contactPersons.length > 0) {
    enriched.source = `${church.source} + Website Enrichment`;
  }
  
  return enriched;
}

function addConfidenceScores(churches: DiscoveredChurch[]): DiscoveredChurch[] {
  return churches.map(church => {
    let score = 0;
    
    // Base score
    score += 10;
    
    // Contact information scoring
    if (church.email) score += 25;
    if (church.phone) score += 20;
    if (church.website) score += 15;
    if (church.contact_name) score += 15;
    
    // Address information
    if (church.address) score += 10;
    if (church.city) score += 5;
    
    // Social media presence
    if (church.social_media?.facebook) score += 5;
    if (church.social_media?.instagram) score += 3;
    
    // Data source reliability
    if (church.source.includes('Website Enrichment')) score += 10;
    if (church.source.includes('Fallback Data')) score -= 30;
    
    // Denomination specificity
    if (church.denomination && church.denomination !== 'Other Protestant') score += 5;
    
    // Cap at 100
    score = Math.min(100, Math.max(0, score));
    
    return {
      ...church,
      confidence_score: score
    };
  });
}

serve(handler);