import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { timestamp, event_type, details, severity } = await req.json();

    // Log security event with structured format
    console.log('SECURITY_EVENT:', JSON.stringify({
      timestamp,
      event_type,
      severity,
      details,
      source: 'application',
    }));

    // In a production environment, you would:
    // 1. Send to a SIEM system
    // 2. Store in a dedicated security database
    // 3. Trigger alerts for high/critical severity events
    // 4. Apply rate limiting and anomaly detection

    return new Response(
      JSON.stringify({ success: true, logged_at: new Date().toISOString() }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in security-logger:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);