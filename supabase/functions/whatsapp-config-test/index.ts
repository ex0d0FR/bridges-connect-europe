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
    // Check authorization header for security
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    // Get all WhatsApp configuration variables
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionInstanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    const evolutionInstanceToken = Deno.env.get('EVOLUTION_INSTANCE_TOKEN');
    
    const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    // Check Evolution API configuration
    const evolutionConfigComplete = evolutionApiUrl && evolutionApiKey && evolutionInstanceName && evolutionInstanceToken;
    
    // Check WhatsApp Business API configuration
    const whatsappConfigComplete = whatsappAccessToken && whatsappPhoneNumberId;

    // Test Evolution API connection if configured
    let evolutionApiStatus = 'not configured';
    if (evolutionConfigComplete) {
      try {
        const response = await fetch(`${evolutionApiUrl}/instance/connectionState/${evolutionInstanceName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          evolutionApiStatus = data.instance?.state || 'unknown';
        } else {
          evolutionApiStatus = `error: ${response.status}`;
        }
      } catch (error) {
        evolutionApiStatus = `connection failed: ${error.message}`;
      }
    }

    // Test WhatsApp Business API if configured
    let whatsappApiStatus = 'not configured';
    if (whatsappConfigComplete) {
      try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${whatsappAccessToken}`,
          },
        });
        
        if (response.ok) {
          whatsappApiStatus = 'connected';
        } else {
          const errorData = await response.json();
          whatsappApiStatus = `error: ${errorData.error?.message || response.status}`;
        }
      } catch (error) {
        whatsappApiStatus = `connection failed: ${error.message}`;
      }
    }

    const configStatus = {
      evolution: {
        configured: evolutionConfigComplete,
        status: evolutionApiStatus,
        details: {
          hasApiUrl: !!evolutionApiUrl,
          hasApiKey: !!evolutionApiKey,
          hasInstanceName: !!evolutionInstanceName,
          hasInstanceToken: !!evolutionInstanceToken,
        }
      },
      whatsapp: {
        configured: whatsappConfigComplete,
        status: whatsappApiStatus,
        details: {
          hasAccessToken: !!whatsappAccessToken,
          hasPhoneNumberId: !!whatsappPhoneNumberId,
        }
      },
      recommendation: evolutionConfigComplete && evolutionApiStatus === 'open' 
        ? 'Use Evolution API' 
        : whatsappConfigComplete && whatsappApiStatus === 'connected'
        ? 'Use WhatsApp Business API'
        : 'Configure at least one WhatsApp service'
    };

    return new Response(JSON.stringify(configStatus), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in whatsapp-config-test function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);