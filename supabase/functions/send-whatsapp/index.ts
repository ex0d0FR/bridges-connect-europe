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

  // Evolution API endpoint for sending messages
  const evolutionEndpoint = `${apiUrl}/message/sendText/${instanceName}`;

  // Format phone number (Evolution API expects numbers without + prefix)
  const formattedPhone = recipient_phone.replace(/^\+/, '');

  const evolutionPayload = {
    number: formattedPhone,
    textMessage: {
      text: message_body
    }
  };

  console.log('Sending Evolution API message:', JSON.stringify(evolutionPayload, null, 2));

  // Send to Evolution API
  const evolutionResponse = await fetch(evolutionEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify(evolutionPayload),
  });

  const evolutionResult = await evolutionResponse.json();

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

    // Check which provider to use
    const useEvolution = provider === 'evolution' || 
      (!Deno.env.get('WHATSAPP_ACCESS_TOKEN') && Deno.env.get('EVOLUTION_API_URL'));

    if (useEvolution) {
      // Evolution API configuration
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
      const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
      const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE_NAME');

      if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
        throw new Error('Evolution API credentials not configured. Please set EVOLUTION_API_URL, EVOLUTION_API_KEY, and EVOLUTION_INSTANCE_NAME');
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
      // WhatsApp Business API configuration
      const whatsappApiUrl = `https://graph.facebook.com/v18.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`
      const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

      if (!accessToken || !Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')) {
        throw new Error('WhatsApp Business API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
      }

      console.log('Using WhatsApp Business API for message');
    }

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
        phoneNumberId: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
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
        whatsapp_response: whatsappResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

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