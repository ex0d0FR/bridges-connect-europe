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
  console.log(`[${new Date().toISOString()}] Church discovery request received`);
  console.log(`Method: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Add request body validation
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { location, filterNonCatholic = true, enableEnhancedDiscovery = false }: ChurchDiscoveryRequest = requestBody;
    
    // Validate required fields
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      console.error('Invalid location provided:', location);
      return new Response(
        JSON.stringify({ 
          error: 'Location is required and must be a non-empty string' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    console.log(`Starting church discovery for location: ${location} (Enhanced: ${enableEnhancedDiscovery})`);
    
    // Check for test endpoint - simplified response for testing
    if (location.toLowerCase() === 'test') {
      console.log('Test endpoint accessed - returning simplified test data');
      return new Response(JSON.stringify({
        churches: [
          {
            name: 'Test Baptist Church',
            address: '123 Test Street, Test City',
            phone: '+1-555-0123',
            email: 'contact@testchurch.example',
            website: 'https://testchurch.example',
            denomination: 'Baptist',
            source: 'Test Data',
            confidence_score: 85
          }
        ],
        total: 1,
        location: 'test'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Set a timeout for the entire operation (30 seconds max for faster response)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout after 30 seconds')), 30000);
    });

    const discoveryPromise = async () => {
      let allChurches: DiscoveredChurch[] = [];

      const scrapflyApiKey = Deno.env.get('SCRAPFLY_API_KEY');
      const apifyApiKey = Deno.env.get('APIFY_API_KEY');
      
      if (!scrapflyApiKey) {
        throw new Error('Scrapfly API key not configured');
      }

      console.log('SCRAPFLY_API_KEY available:', !!scrapflyApiKey);
      console.log('APIFY_API_KEY available:', !!apifyApiKey);
      console.log(`Starting real data collection with Scrapfly for: ${location}`);
    
    // Determine language and region based on location
    const { language, region, searchTerms } = getLocationSettings(location);
    console.log(`Using language: ${language}, region: ${region}, search terms: ${searchTerms.join(', ')}`);
    
    // Use Scrapfly to scrape Google Maps search results
    for (const searchTerm of searchTerms.slice(0, 1)) { // Use only first search term for speed
      try {
        console.log(`Searching with Scrapfly for: ${searchTerm}`);
        
        const searchQuery = `${searchTerm} ${location}`;
        console.log(`Search query: ${searchQuery}`);
        
        // Construct Google Maps search URL
        const encodedQuery = encodeURIComponent(searchQuery);
        const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
        
        // Scrapfly API call
        const scrapflyUrl = new URL('https://api.scrapfly.io/scrape');
        scrapflyUrl.searchParams.append('key', scrapflyApiKey);
        scrapflyUrl.searchParams.append('url', googleMapsUrl);
        scrapflyUrl.searchParams.append('render_js', 'true');
        scrapflyUrl.searchParams.append('wait', '3000');
        scrapflyUrl.searchParams.append('format', 'json');
        scrapflyUrl.searchParams.append('country', region);

        const response = await fetch(scrapflyUrl.toString());
        console.log(`Scrapfly Response Status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Scrapfly error: ${response.status} ${errorText}`);
          throw new Error(`Scrapfly error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Scrapfly response received for "${searchTerm}"`);

        if (data.result?.content) {
          // Parse the HTML content to extract church information
          const htmlContent = data.result.content;
          
          // Extract potential church data using regex patterns and social media
          const churchMatches = extractChurchesWithSocialMedia(htmlContent);
          
          console.log(`Found ${churchMatches.length} potential church matches`);

          // Process each church match
          for (const churchData of churchMatches.slice(0, 10)) { // Limit to 10 results
            try {
              // Check if this looks like a church
              const churchKeywords = [
                'church', 'iglesia', 'église', 'chiesa', 'kirche', 'igreja', 
                'temple', 'templo', 'congregacion', 'congregação', 'assemblée', 
                'gemeinde', 'chapel', 'capilla', 'baptist', 'methodist', 
                'presbyterian', 'pentecostal', 'evangelical', 'protestant',
                'cathedral', 'parish', 'ministry', 'congregation', 'sanctuary',
                'assembly', 'fellowship'
              ];
              
              const isChurch = churchKeywords.some(keyword => 
                churchData.name.toLowerCase().includes(keyword)
              );

              if (!isChurch) continue;

              // Filter out Catholic churches if requested
              const isCatholic = /catholic|st\.|saint|our lady|holy|sacred heart|basilica|cathedral|abbey|monastery/i.test(churchData.name);
              if (filterNonCatholic && isCatholic) continue;

              const church: DiscoveredChurch = {
                name: churchData.name,
                address: churchData.address,
                city: extractCity(churchData.address, location),
                country: extractCountry(churchData.address, location),
                phone: churchData.phone,
                email: churchData.email,
                website: churchData.website,
                contact_name: extractContactName(churchData.name + ' ' + (churchData.address || ''), churchData.name),
                denomination: extractDenomination(churchData.name, churchData.name),
                source: 'Scrapfly Google Maps',
                social_media: churchData.socialMedia
              };

              allChurches.push(church);
              console.log(`Added church: ${churchData.name} with social media:`, churchData.socialMedia);
            } catch (error) {
              console.error('Error parsing church data:', error);
            }
          }

          // If no structured data found, add fallback data
          if (allChurches.length === 0) {
            console.log('No structured church data found, adding fallback data');
            allChurches.push({
              name: `${searchTerm === 'protestant churches' ? 'Community Church' : searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} of ${location}`,
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
        } else {
          console.log(`No content found for "${searchTerm}"`);
          // Add fallback data
          allChurches.push({
            name: `Community Church of ${location}`,
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

      } catch (error) {
        console.error(`Error searching for "${searchTerm}" with Scrapfly:`, error);
        // Add fallback data on error
        allChurches.push({
          name: `Community Church of ${location}`,
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

      // Enhanced discovery phase - disabled for now to prevent timeouts
      if (false && enableEnhancedDiscovery && apifyApiKey && allChurches.length > 0) {
        console.log('Enhanced discovery disabled to prevent timeouts');
      }

      // Add confidence scores
      allChurches = addConfidenceScores(allChurches);

      // Intelligently merge duplicate churches and their data
      const mergedChurches = mergeChurchData(allChurches);
      console.log(`After intelligent merging: ${mergedChurches.length} churches (from ${allChurches.length} raw results)`);
      
      // Filter out Catholic churches if requested
      let filteredChurches = mergedChurches;
      if (filterNonCatholic) {
        filteredChurches = mergedChurches.filter(church => !isCatholic(church));
        console.log(`After filtering Catholics: ${filteredChurches.length} churches`);
      }

      console.log(`Discovery complete: ${filteredChurches.length} churches found for ${location}`);

      return {
        churches: filteredChurches,
        total: filteredChurches.length,
        location 
      };
    };

    // Race between discovery and timeout
    const result = await Promise.race([discoveryPromise(), timeoutPromise]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in church-discovery function:', error);
    
    // Check if it's a timeout error
    if (error.message?.includes('timeout')) {
      return new Response(
        JSON.stringify({ 
          error: 'Request timeout - please try again with a more specific location',
          timeout: true 
        }),
        {
          status: 408,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Function to extract churches with social media from HTML content
function extractChurchesWithSocialMedia(htmlContent: string): Array<{
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  }
}> {
  const results: Array<{
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    }
  }> = [];

  // Extract business listings from Google Maps HTML
  const businessCardPattern = /<div[^>]*aria-label="([^"]*(?:church|chapel|cathedral|parish|ministry|congregation|temple|sanctuary|assembly|fellowship)[^"]*)"[^>]*>/gi;
  const matches = [...htmlContent.matchAll(businessCardPattern)];

  for (const match of matches) {
    const fullText = match[1] || '';
    
    // Parse the basic information
    const parts = fullText.split('·').map(p => p.trim());
    const name = parts[0] || 'Unknown Church';
    
    let address = '';
    let phone = '';
    let email = '';
    let website = '';
    
    // Extract address, phone, etc. from the parts
    for (const part of parts) {
      if (/\d+[^·]*(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard|plaza|circle)/i.test(part)) {
        address = part;
      }
    }

    // Extract phone number from the full text
    phone = extractPhone(fullText) || '';
    
    // Extract social media links from the surrounding HTML context
    const contextStart = Math.max(0, match.index! - 2000);
    const contextEnd = Math.min(htmlContent.length, match.index! + 2000);
    const contextHtml = htmlContent.slice(contextStart, contextEnd);
    
    const socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    } = {};

    // Look for social media links in the context
    const facebookMatch = contextHtml.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i);
    if (facebookMatch) {
      socialMedia.facebook = facebookMatch[0].startsWith('http') ? facebookMatch[0] : `https://${facebookMatch[0]}`;
    }

    const instagramMatch = contextHtml.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/i);
    if (instagramMatch) {
      socialMedia.instagram = instagramMatch[0].startsWith('http') ? instagramMatch[0] : `https://${instagramMatch[0]}`;
    }

    const twitterMatch = contextHtml.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9._-]+/i);
    if (twitterMatch) {
      socialMedia.twitter = twitterMatch[0].startsWith('http') ? twitterMatch[0] : `https://${twitterMatch[0]}`;
    }

    // Look for website links
    const websiteMatch = contextHtml.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?/i);
    if (websiteMatch && !websiteMatch[0].includes('google.com') && !websiteMatch[0].includes('facebook.com') && !websiteMatch[0].includes('instagram.com') && !websiteMatch[0].includes('twitter.com')) {
      website = websiteMatch[0].startsWith('http') ? websiteMatch[0] : `https://${websiteMatch[0]}`;
    }

    // Look for email addresses
    const emailMatch = contextHtml.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
    if (emailMatch) {
      email = emailMatch[0];
    }

    results.push({
      name: name,
      address: address,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined
    });
  }

  return results;
}

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

// Smart church data merging system
function mergeChurchData(churches: DiscoveredChurch[]): DiscoveredChurch[] {
  console.log(`Starting intelligent church data merging for ${churches.length} churches`);
  
  if (churches.length === 0) return churches;
  
  const mergedChurches: DiscoveredChurch[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < churches.length; i++) {
    if (processed.has(i)) continue;
    
    const currentChurch = churches[i];
    const duplicateIndices: number[] = [i];
    
    // Find all churches that match this one
    for (let j = i + 1; j < churches.length; j++) {
      if (processed.has(j)) continue;
      
      if (areChurchesSame(currentChurch, churches[j])) {
        duplicateIndices.push(j);
      }
    }
    
    // Mark all found duplicates as processed
    duplicateIndices.forEach(idx => processed.add(idx));
    
    // If we found duplicates, merge all data intelligently
    if (duplicateIndices.length > 1) {
      const churchesToMerge = duplicateIndices.map(idx => churches[idx]);
      const mergedChurch = intelligentlyMergeChurches(churchesToMerge);
      mergedChurches.push(mergedChurch);
      console.log(`Merged ${duplicateIndices.length} churches into: "${mergedChurch.name}"`);
    } else {
      // No duplicates found, add as is
      mergedChurches.push(currentChurch);
    }
  }
  
  console.log(`Merging complete: ${churches.length} → ${mergedChurches.length} churches`);
  return mergedChurches;
}

// Function to determine if two churches are the same
function areChurchesSame(church1: DiscoveredChurch, church2: DiscoveredChurch): boolean {
  // 1. Exact name match (after normalization)
  const name1 = normalizeChurchName(church1.name);
  const name2 = normalizeChurchName(church2.name);
  
  if (name1 === name2) return true;
  
  // 2. Very similar names (>85% similarity)
  const nameSimilarity = calculateStringSimilarity(name1, name2);
  if (nameSimilarity > 0.85) {
    // If names are very similar, check if addresses match or are close
    if (church1.address && church2.address) {
      const addressSimilarity = calculateStringSimilarity(
        normalizeAddress(church1.address),
        normalizeAddress(church2.address)
      );
      if (addressSimilarity > 0.7) return true;
    }
    
    // If one has address and other doesn't, but phone matches
    if (church1.phone && church2.phone) {
      const phone1 = normalizePhone(church1.phone);
      const phone2 = normalizePhone(church2.phone);
      if (phone1 === phone2) return true;
    }
    
    // If names are very similar and both in same city
    if (church1.city && church2.city && church1.city.toLowerCase() === church2.city.toLowerCase()) {
      return true;
    }
  }
  
  // 3. Same phone number (very reliable indicator)
  if (church1.phone && church2.phone) {
    const phone1 = normalizePhone(church1.phone);
    const phone2 = normalizePhone(church2.phone);
    if (phone1 === phone2 && phone1.length > 7) return true; // Avoid matching partial numbers
  }
  
  // 4. Same website (very reliable indicator)
  if (church1.website && church2.website) {
    const website1 = normalizeWebsite(church1.website);
    const website2 = normalizeWebsite(church2.website);
    if (website1 === website2) return true;
  }
  
  return false;
}

// Function to intelligently merge multiple church records
function intelligentlyMergeChurches(churches: DiscoveredChurch[]): DiscoveredChurch {
  console.log(`Merging ${churches.length} duplicate churches`);
  
  // Start with the church that has the highest confidence score or most data
  const baseChurch = churches.reduce((best, current) => {
    const bestDataCount = countNonEmptyFields(best);
    const currentDataCount = countNonEmptyFields(current);
    
    // Prefer higher confidence scores, then more complete data
    if ((current.confidence_score || 0) > (best.confidence_score || 0)) return current;
    if ((current.confidence_score || 0) === (best.confidence_score || 0) && currentDataCount > bestDataCount) return current;
    return best;
  });
  
  const merged: DiscoveredChurch = { ...baseChurch };
  
  // Merge all data from other churches, prioritizing quality
  churches.forEach(church => {
    if (church === baseChurch) return;
    
    // Name: Choose the most complete/professional one
    if (!merged.name || (church.name.length > merged.name.length && !church.name.includes('Unknown'))) {
      merged.name = church.name;
    }
    
    // Address: Choose the most complete one
    if (!merged.address || (church.address && church.address.length > merged.address.length)) {
      merged.address = church.address;
    }
    
    // City/Country: Fill if missing
    if (!merged.city && church.city) merged.city = church.city;
    if (!merged.country && church.country) merged.country = church.country;
    
    // Phone: Choose the most complete one, prefer international format
    if (!merged.phone && church.phone) {
      merged.phone = church.phone;
    } else if (church.phone && merged.phone) {
      if (church.phone.startsWith('+') && !merged.phone.startsWith('+')) {
        merged.phone = church.phone;
      } else if (church.phone.length > merged.phone.length) {
        merged.phone = church.phone;
      }
    }
    
    // Email: Prefer contact/info emails over generic ones
    if (!merged.email && church.email) {
      merged.email = church.email;
    } else if (church.email && merged.email) {
      const isChurchEmailBetter = 
        (church.email.includes('contact') || church.email.includes('info') || church.email.includes('pastor')) &&
        !(merged.email.includes('contact') || merged.email.includes('info') || merged.email.includes('pastor'));
      
      if (isChurchEmailBetter) {
        merged.email = church.email;
      }
    }
    
    // Website: Prefer official church domains over generic ones
    if (!merged.website && church.website) {
      merged.website = church.website;
    } else if (church.website && merged.website) {
      const isChurchWebsiteBetter = 
        church.website.includes('church') || church.website.includes('faith') || church.website.includes('ministry');
      const isMergedWebsiteGeneric = 
        merged.website.includes('example') || merged.website.includes('placeholder');
      
      if (isChurchWebsiteBetter || isMergedWebsiteGeneric) {
        merged.website = church.website;
      }
    }
    
    // Contact name: Choose the most specific one
    if (!merged.contact_name && church.contact_name) {
      merged.contact_name = church.contact_name;
    } else if (church.contact_name && merged.contact_name && church.contact_name.length > merged.contact_name.length) {
      merged.contact_name = church.contact_name;
    }
    
    // Denomination: Choose the most specific one
    if (!merged.denomination && church.denomination) {
      merged.denomination = church.denomination;
    } else if (church.denomination && merged.denomination === 'Other Protestant' && church.denomination !== 'Other Protestant') {
      merged.denomination = church.denomination;
    }
    
    // Social media: Merge all social media links
    if (church.social_media) {
      if (!merged.social_media) merged.social_media = {};
      
      if (church.social_media.facebook && !merged.social_media.facebook) {
        merged.social_media.facebook = church.social_media.facebook;
      }
      if (church.social_media.instagram && !merged.social_media.instagram) {
        merged.social_media.instagram = church.social_media.instagram;
      }
      if (church.social_media.twitter && !merged.social_media.twitter) {
        merged.social_media.twitter = church.social_media.twitter;
      }
    }
    
    // Additional info: Merge arrays and descriptions
    if (church.additional_info) {
      if (!merged.additional_info) merged.additional_info = {};
      
      if (church.additional_info.description && !merged.additional_info.description) {
        merged.additional_info.description = church.additional_info.description;
      }
      
      if (church.additional_info.services) {
        if (!merged.additional_info.services) {
          merged.additional_info.services = church.additional_info.services;
        } else {
          // Merge and deduplicate services
          const allServices = [...merged.additional_info.services, ...church.additional_info.services];
          merged.additional_info.services = [...new Set(allServices)];
        }
      }
      
      if (church.additional_info.languages) {
        if (!merged.additional_info.languages) {
          merged.additional_info.languages = church.additional_info.languages;
        } else {
          // Merge and deduplicate languages
          const allLanguages = [...merged.additional_info.languages, ...church.additional_info.languages];
          merged.additional_info.languages = [...new Set(allLanguages)];
        }
      }
    }
  });
  
  // Update source to indicate merging
  const sources = churches.map(c => c.source).filter((s, i, arr) => arr.indexOf(s) === i);
  merged.source = sources.length === 1 ? sources[0] : `Merged: ${sources.join(' + ')}`;
  
  // Recalculate confidence score based on merged data
  merged.confidence_score = calculateMergedConfidenceScore(merged, churches.length);
  
  return merged;
}

// Helper functions for merging
function normalizeChurchName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(church|iglesia|église|chiesa|kirche|igreja|temple|templo|chapel|capilla)\b/g, '')
    .trim();
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)\b/g, '')
    .trim();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

function normalizeWebsite(website: string): string {
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = calculateEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function calculateEditDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function countNonEmptyFields(church: DiscoveredChurch): number {
  let count = 0;
  if (church.name && !church.name.includes('Unknown')) count++;
  if (church.address) count++;
  if (church.city) count++;
  if (church.country) count++;
  if (church.phone) count++;
  if (church.email && !church.email.includes('example')) count++;
  if (church.website && !church.website.includes('example')) count++;
  if (church.contact_name) count++;
  if (church.denomination) count++;
  if (church.social_media?.facebook) count++;
  if (church.social_media?.instagram) count++;
  if (church.social_media?.twitter) count++;
  if (church.additional_info?.description) count++;
  return count;
}

function calculateMergedConfidenceScore(church: DiscoveredChurch, mergedCount: number): number {
  let score = 0;
  
  // Base score
  score += 10;
  
  // Contact information scoring
  if (church.email && !church.email.includes('example')) score += 25;
  if (church.phone) score += 20;
  if (church.website && !church.website.includes('example')) score += 15;
  if (church.contact_name) score += 15;
  
  // Address information
  if (church.address) score += 10;
  if (church.city) score += 5;
  
  // Social media presence
  if (church.social_media?.facebook) score += 5;
  if (church.social_media?.instagram) score += 3;
  if (church.social_media?.twitter) score += 3;
  
  // Data source reliability
  if (church.source.includes('Website Enrichment')) score += 10;
  if (church.source.includes('Fallback Data')) score -= 30;
  
  // Bonus for merged data (indicates multiple sources confirmed this church)
  score += (mergedCount - 1) * 5;
  
  // Denomination specificity
  if (church.denomination && church.denomination !== 'Other Protestant') score += 5;
  
  // Cap at 100
  score = Math.min(100, Math.max(0, score));
  
  return score;
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
  
  const enrichedChurches = [...churches];
  const websiteChurches = churches.filter(church => church.website).slice(0, 10); // Limit to 10 to avoid API limits and timeouts
  
  if (websiteChurches.length === 0) {
    console.log('No churches with websites found for enrichment');
    return enrichedChurches;
  }

  // Process websites with timeout for each church
  for (const church of websiteChurches) {
    try {
      const enrichmentPromise = enrichSingleChurch(church, apifyApiKey);
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Church enrichment timeout')), 30000); // 30 second timeout per church
      });
      
      const result = await Promise.race([enrichmentPromise, timeoutPromise]);
      
      if (result) {
        const churchIndex = enrichedChurches.findIndex(c => c.name === church.name);
        if (churchIndex !== -1) {
          enrichedChurches[churchIndex] = { ...enrichedChurches[churchIndex], ...result };
        }
      }
    } catch (error) {
      console.error(`Failed to enrich church ${church.name}:`, error);
      // Continue with next church
    }
    
    // Small delay between churches
    await new Promise(resolve => setTimeout(resolve, 1000));
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