import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  recipient_phone: string
  template_name?: string
  language_code?: string
  template_components?: any[]
  message_body?: string
  message_type: 'template' | 'text'
  isTest?: boolean
}

// Validate Evolution API configuration
function validateEvolutionConfig(apiUrl: string, apiKey: string, instanceName: string) {
  const errors = [];
  
  if (!apiUrl) {
    errors.push('EVOLUTION_API_URL is required');
  } else if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    errors.push('EVOLUTION_API_URL cannot be localhost - use ngrok or a public URL');
  }
  
  if (!apiKey) {
    errors.push('EVOLUTION_API_KEY is required');
  }
  
  if (!instanceName) {
    errors.push('EVOLUTION_INSTANCE_NAME is required');
  }
  
  return errors;
}

// Evolution API function
async function sendViaEvolution(
  apiUrl: string,
  apiKey: string,
  instanceName: string,
  messageData: any,
  supabaseClient: any,
  corsHeaders: any
) {
  const { recipient_phone, message_body, isTest, templateId, campaignId, churchId, user } = messageData;

  // Validate configuration
  const configErrors = validateEvolutionConfig(apiUrl, apiKey, instanceName);
  if (configErrors.length > 0) {
    throw new Error(`Evolution API configuration errors: ${configErrors.join(', ')}`);
  }

  // Evolution API endpoint for sending messages
  const evolutionEndpoint = `${apiUrl}/message/sendText/${instanceName}`;
  console.log('Evolution API endpoint:', evolutionEndpoint);

  // Format phone number (Evolution API expects numbers without + prefix)
  const formattedPhone = recipient_phone.replace(/^\+/, '');

  const evolutionPayload = {
    number: formattedPhone,
    textMessage: {
      text: message_body
    }
  };

  console.log('Sending Evolution API message:', JSON.stringify(evolutionPayload, null, 2));

  let evolutionResponse;
  let evolutionResult;

  try {
    // Send to Evolution API with timeout
    evolutionResponse = await Promise.race([
      fetch(evolutionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify(evolutionPayload),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evolution API request timeout (10s)')), 10000)
      )
    ]) as Response;

    evolutionResult = await evolutionResponse.json();
  } catch (error) {
    console.error('Evolution API connection error:', error);
    
    if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
      throw new Error(`Cannot connect to Evolution API at ${apiUrl}. Please check that the API is running and accessible.`);
    } else if (error.message.includes('timeout')) {
      throw new Error(`Evolution API request timeout. The API at ${apiUrl} is not responding.`);
    } else {
      throw new Error(`Evolution API connection failed: ${error.message}`);
    }
  }

  if (!evolutionResponse.ok) {
    console.error('Evolution API error details:', {
      status: evolutionResponse.status,
      statusText: evolutionResponse.statusText,
      response: evolutionResult,
      phoneNumber: recipient_phone,
      instanceName: instanceName
    });
    
    throw new Error(`Evolution API error: ${evolutionResult.message || 'Unknown error'} (Status: ${evolutionResponse.status})`);
  }

  console.log('Evolution API message sent successfully:', evolutionResult);

  // Log to database if not a test message
  if (!isTest && churchId && campaignId) {
    const { error: dbError } = await supabaseClient
      .from('messages')
      .insert({
        type: 'whatsapp',
        church_id: churchId,
        campaign_id: campaignId,
        template_id: templateId,
        content: message_body,
        recipient_phone: recipient_phone,
        status: 'sent',
        external_id: evolutionResult.key?.id || evolutionResult.messageId,
        sent_at: new Date().toISOString(),
        created_by: user.id
      });

    if (dbError) {
      console.error('Error logging Evolution API message to database:', dbError);
    }
  } else {
    console.log('Test message - skipping database logging');
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_id: evolutionResult.key?.id || evolutionResult.messageId,
      status: 'sent',
      evolution_response: evolutionResult,
      provider: 'evolution'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header and extract JWT token
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header received:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid authorization header found');
      throw new Error('No valid authorization header provided');
    }

    // Extract JWT token from "Bearer ..." header
    const jwt = authHeader.replace('Bearer ', '');
    console.log('JWT token extracted:', jwt ? 'yes' : 'no');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://ovoldtknfdyvyypadnmf.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    
    // Create Supabase client with service role key for server operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Verify JWT and get user data
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    console.log('User data:', user ? { id: user.id, email: user.email } : 'null');
    console.log('Auth error:', authError);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      throw new Error(`Authentication failed: ${authError?.message || 'No user found'}`);
    }

    const requestBody = await req.json();
    const { recipient_phone, template_name, language_code = 'en', template_components, message_body, message_type, isTest, templateId, campaignId, churchId, provider = 'whatsapp' }: WhatsAppMessage & { templateId?: string, campaignId?: string, churchId?: string, provider?: 'whatsapp' | 'evolution' } = requestBody;

    // Check configuration and determine provider
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    const hasEvolutionConfig = evolutionApiUrl && evolutionApiKey && evolutionInstance;
    const hasWhatsAppConfig = whatsappAccessToken && whatsappPhoneNumberId;

    console.log('Configuration check:', {
      hasEvolutionConfig,
      hasWhatsAppConfig,
      requestedProvider: provider,
      evolutionApiUrl: evolutionApiUrl ? `${evolutionApiUrl.substring(0, 20)}...` : 'not set'
    });

    // Determine which provider to use
    const useEvolution = provider === 'evolution' || 
      (hasEvolutionConfig && !hasWhatsAppConfig) ||
      (hasEvolutionConfig && provider !== 'whatsapp');

    if (useEvolution) {
      if (!hasEvolutionConfig) {
        throw new Error('Evolution API credentials not configured. Please set EVOLUTION_API_URL, EVOLUTION_API_KEY, and EVOLUTION_INSTANCE_NAME in your secrets.');
      }

      console.log('Using Evolution API for WhatsApp message');
      return await sendViaEvolution(evolutionApiUrl, evolutionApiKey, evolutionInstance, {
        recipient_phone,
        message_body,
        message_type,
        template_name,
        language_code,
        template_components,
        isTest,
        templateId,
        campaignId,
        churchId,
        user
      }, supabaseClient, corsHeaders);
    } else {
      if (!hasWhatsAppConfig) {
        throw new Error('WhatsApp Business API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your secrets.');
      }

      console.log('Using WhatsApp Business API for message');
      
      // WhatsApp Business API implementation
      const whatsappApiUrl = `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`;
      const accessToken = whatsappAccessToken;

      let messagePayload: any

      if (message_type === 'template' && template_name) {
        // Send template message
        messagePayload = {
          messaging_product: 'whatsapp',
          to: recipient_phone,
          type: 'template',
          template: {
            name: template_name,
            language: {
              code: language_code
            }
          }
        }

        if (template_components && template_components.length > 0) {
          messagePayload.template.components = template_components
        }
      } else {
        // Send text message
        messagePayload = {
          messaging_product: 'whatsapp',
          to: recipient_phone,
          type: 'text',
          text: {
            body: message_body
          }
        }
      }

      console.log('Sending WhatsApp message:', JSON.stringify(messagePayload, null, 2))

      // Send to WhatsApp Business API
      const whatsappResponse = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })

      const whatsappResult = await whatsappResponse.json()

      if (!whatsappResponse.ok) {
        console.error('WhatsApp API error details:', {
          status: whatsappResponse.status,
          statusText: whatsappResponse.statusText,
          response: whatsappResult,
          phoneNumber: recipient_phone,
          phoneNumberId: whatsappPhoneNumberId
        })
        
        // Check for specific token expiration error
        if (whatsappResult.error?.code === 190) {
          throw new Error(`WhatsApp access token has expired. Please update your token in the settings. Error: ${whatsappResult.error.message}`)
        }
        
        // Check for invalid phone number format
        if (whatsappResult.error?.code === 131000) {
          throw new Error(`Invalid phone number format: ${recipient_phone}. Please use international format (+country_code_phone_number)`)
        }
        
        throw new Error(`WhatsApp API error: ${whatsappResult.error?.message || 'Unknown error'} (Code: ${whatsappResult.error?.code || 'unknown'})`)
      }

      console.log('WhatsApp message sent successfully:', whatsappResult)

      // Log to database if not a test message
      if (!isTest && churchId && campaignId) {
        const { error: dbError } = await supabaseClient
          .from('messages')
          .insert({
            type: 'whatsapp',
            church_id: churchId,
            campaign_id: campaignId,
            template_id: templateId,
            content: message_body,
            recipient_phone: recipient_phone,
            status: 'sent',
            external_id: whatsappResult.messages?.[0]?.id,
            sent_at: new Date().toISOString(),
            created_by: user.id
          });

        if (dbError) {
          console.error('Error logging WhatsApp message to database:', dbError);
        }
      } else {
        console.log('Test message - skipping database logging');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message_id: whatsappResult.messages?.[0]?.id,
          status: 'sent',
          whatsapp_response: whatsappResult,
          provider: 'whatsapp'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})