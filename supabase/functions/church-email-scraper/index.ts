import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChurchEmailScrapingRequest {
  churchIds: string[];
  batchSize?: number;
}

interface ScrapingResult {
  churchId: string;
  churchName: string;
  foundEmails: string[];
  status: 'success' | 'failed' | 'no_emails_found';
  error?: string;
}

interface ScrapingProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: ScrapingResult[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log(`[${new Date().toISOString()}] Church email scraper request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { churchIds, batchSize = 10 }: ChurchEmailScrapingRequest = await req.json();
    
    if (!churchIds || !Array.isArray(churchIds) || churchIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'churchIds array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Limit the number of churches to process to avoid query limits
    const limitedChurchIds = churchIds.slice(0, 50); // Process max 50 churches at a time
    console.log(`Processing ${limitedChurchIds.length} out of ${churchIds.length} requested churches`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get church data with better error handling
    console.log('Fetching church data from database...');
    const { data: churches, error: churchError } = await supabase
      .from('churches')
      .select('id, name, website, email')
      .in('id', limitedChurchIds);

    if (churchError) {
      console.error('Database error:', churchError);
      throw new Error(`Failed to fetch churches: ${churchError.message}`);
    }

    if (!churches || churches.length === 0) {
      console.log('No churches found with the provided IDs');
      return new Response(
        JSON.stringify({ error: 'No churches found with the provided IDs' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Processing ${churches.length} churches for email scraping`);

    const progress: ScrapingProgress = {
      total: churches.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: []
    };

    // Process churches in batches
    for (let i = 0; i < churches.length; i += batchSize) {
      const batch = churches.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (church) => {
        try {
          console.log(`Processing church: ${church.name}`);
          
          const foundEmails = await searchChurchEmails(church.name, church.website);
          
          const result: ScrapingResult = {
            churchId: church.id,
            churchName: church.name,
            foundEmails,
            status: foundEmails.length > 0 ? 'success' : 'no_emails_found'
          };
          
          progress.processed++;
          if (foundEmails.length > 0) {
            progress.succeeded++;
          }
          
          console.log(`✓ Found ${foundEmails.length} email(s) for ${church.name}`);
          return result;
          
        } catch (error) {
          console.error(`Error processing ${church.name}: ${error.message}`);
          
          const result: ScrapingResult = {
            churchId: church.id,
            churchName: church.name,
            foundEmails: [],
            status: 'failed',
            error: error.message
          };
          
          progress.processed++;
          progress.failed++;
          return result;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          progress.results.push(result.value);
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < churches.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Email scraping complete. Success: ${progress.succeeded}, Failed: ${progress.failed}`);

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error in church-email-scraper function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function searchChurchEmails(churchName: string, website?: string): Promise<string[]> {
  const foundEmails: string[] = [];
  
  // Generate search queries
  const queries = generateSearchQueries(churchName, website);
  
  for (const query of queries.slice(0, 2)) { // Limit to 2 queries per church
    try {
      console.log(`Searching: ${query}`);
      
      const searchResults = await performWebSearch(query);
      if (searchResults) {
        const emails = extractEmailsFromText(searchResults);
        foundEmails.push(...emails);
      }
      
      // Delay between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`Search failed for query "${query}": ${error.message}`);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(foundEmails)];
}

function generateSearchQueries(churchName: string, website?: string): string[] {
  const cleanChurchName = churchName.replace(/[^\w\s]/g, '').trim();
  const domain = website ? new URL(website).hostname : '';
  
  const queries = [
    `"${cleanChurchName}" contact email`,
    `"${cleanChurchName}" pastor email`,
    `"${cleanChurchName}" church email address`,
    `"${cleanChurchName}" ministry contact`
  ];
  
  if (domain) {
    queries.unshift(`site:${domain} contact email`);
    queries.push(`site:${domain} pastor contact`);
  }
  
  return queries.filter(query => query.trim());
}

function extractEmailsFromText(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  
  // Filter out unwanted emails
  const unwantedPatterns = [
    'noreply@',
    'no-reply@',
    'donotreply@',
    'admin@',
    'webmaster@',
    'info@example.com',
    'test@',
    'support@',
    'privacy@',
    'legal@',
    'marketing@',
    'sales@'
  ];
  
  return emails.filter(email => 
    !unwantedPatterns.some(pattern => email.toLowerCase().includes(pattern))
  );
}

async function performWebSearch(query: string): Promise<string | null> {
  // Try SerpAPI first (primary choice)
  const serpApiKey = Deno.env.get('SERPAPI_KEY');
  if (serpApiKey) {
    try {
      const serpResult = await searchWithSerpAPI(query, serpApiKey);
      if (serpResult) return serpResult;
    } catch (error) {
      console.log(`SerpAPI search failed: ${error.message}`);
    }
  }
  
  // Try Tavily as fallback
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (tavilyApiKey) {
    try {
      const tavilyResult = await searchWithTavily(query, tavilyApiKey);
      if (tavilyResult) return tavilyResult;
    } catch (error) {
      console.log(`Tavily search failed: ${error.message}`);
    }
  }
  
  // Try Scrapfly as final fallback
  const scrapflyApiKey = Deno.env.get('SCRAPFLY_API_KEY');
  if (scrapflyApiKey) {
    try {
      const scrapflyResult = await searchWithScrapfly(query, scrapflyApiKey);
      if (scrapflyResult) return scrapflyResult;
    } catch (error) {
      console.log(`Scrapfly search failed: ${error.message}`);
    }
  }
  
  return null;
}

async function searchWithTavily(query: string, apiKey: string): Promise<string | null> {
  const tavilyUrl = 'https://api.tavily.com/search';
  
  const requestBody = {
    query,
    search_depth: 'basic',
    include_answer: false,
    include_images: false,
    include_raw_content: true,
    max_results: 5,
    exclude_domains: ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com']
  };

  const response = await fetch(tavilyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    const combinedContent = data.results
      .map((result: any) => `${result.title || ''} ${result.content || ''} ${result.raw_content || ''}`)
      .join(' ');
    
    return combinedContent;
  }

  return null;
}

async function searchWithSerpAPI(query: string, apiKey: string): Promise<string | null> {
  const serpApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5`;
  
  const response = await fetch(serpApiUrl);
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(`SerpAPI error: ${data.error || response.statusText}`);
  }
  
  // Extract text from organic results
  const organicResults = data.organic_results || [];
  const searchText = organicResults
    .map((result: any) => `${result.title} ${result.snippet} ${result.link}`)
    .join(' ');
  
  return searchText;
}

async function searchWithScrapfly(query: string, apiKey: string): Promise<string | null> {
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  
  const scrapflyUrl = new URL('https://api.scrapfly.io/scrape');
  scrapflyUrl.searchParams.append('key', apiKey);
  scrapflyUrl.searchParams.append('url', googleSearchUrl);
  scrapflyUrl.searchParams.append('render_js', 'false');
  scrapflyUrl.searchParams.append('format', 'json');
  
  const response = await fetch(scrapflyUrl.toString());
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Scrapfly error: ${response.statusText}`);
  }
  
  return data.result?.content || null;
}

serve(handler);