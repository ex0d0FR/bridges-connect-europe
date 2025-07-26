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

    const { recipient_phone, template_name, language_code = 'en', template_components, message_body, message_type, isTest }: WhatsAppMessage = await req.json()

    // WhatsApp Business API configuration
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

    if (!accessToken || !Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')) {
      throw new Error('WhatsApp credentials not configured')
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
      console.error('WhatsApp API error:', whatsappResult)
      
      // Check for specific token expiration error
      if (whatsappResult.error?.code === 190) {
        throw new Error(`WhatsApp access token has expired. Please update your token in the settings. Error: ${whatsappResult.error.message}`)
      }
      
      throw new Error(`WhatsApp API error: ${whatsappResult.error?.message || 'Unknown error'}`)
    }

    console.log('WhatsApp message sent successfully:', whatsappResult)

    // For test messages, we don't log to database
    if (isTest) {
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