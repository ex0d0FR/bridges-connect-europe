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

// Twilio WhatsApp function
async function sendViaTwilio(
  accountSid: string,
  authToken: string,
  fromPhone: string,
  messageData: any,
  supabaseClient: any,
  corsHeaders: any
) {
  const { recipient_phone, message_body, isTest, templateId, campaignId, churchId, user } = messageData;

  // Validate configuration
  if (!accountSid || !authToken || !fromPhone) {
    throw new Error('Twilio configuration incomplete. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
  }

  // Ensure the from number is in WhatsApp format
  const twilioFromNumber = fromPhone.startsWith('whatsapp:') ? fromPhone : `whatsapp:${fromPhone}`;
  const twilioToNumber = recipient_phone.startsWith('whatsapp:') ? recipient_phone : `whatsapp:${recipient_phone}`;

  // Twilio API endpoint
  const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  console.log('Twilio WhatsApp endpoint:', twilioEndpoint);

  const twilioPayload = new URLSearchParams({
    From: twilioFromNumber,
    To: twilioToNumber,
    Body: message_body
  });

  console.log('Sending Twilio WhatsApp message:', {
    from: twilioFromNumber,
    to: twilioToNumber,
    body: message_body
  });

  let twilioResponse;
  let twilioResult;

  try {
    // Send to Twilio API with timeout
    twilioResponse = await Promise.race([
      fetch(twilioEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: twilioPayload,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Twilio API request timeout (10s)')), 10000)
      )
    ]) as Response;

    const responseText = await twilioResponse.text();
    console.log(`Twilio API raw response: ${responseText.substring(0, 200)}`);
    
    try {
      twilioResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Twilio API returned non-JSON response:', responseText.substring(0, 500));
      throw new Error(`Twilio API returned invalid response: ${responseText.substring(0, 100)}`);
    }

    if (!twilioResponse.ok) {
      console.error(`Twilio API HTTP error: ${twilioResponse.status} - ${responseText}`);
      throw new Error(`Twilio API error: ${twilioResult.message || 'Unknown error'} (Code: ${twilioResult.code || 'unknown'})`);
    }
  } catch (error) {
    console.error('Twilio API connection error:', error);
    
    if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
      throw new Error(`Cannot connect to Twilio API. Please check your internet connection.`);
    } else if (error.message.includes('timeout')) {
      throw new Error(`Twilio API request timeout. Please try again.`);
    } else if (error.message.includes('invalid response') || error.message.includes('HTTP error')) {
      throw error; // Re-throw our custom errors
    } else {
      throw new Error(`Twilio API connection failed: ${error.message}`);
    }
  }

  console.log('Twilio WhatsApp message sent successfully:', twilioResult);

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
        external_id: twilioResult.sid,
        sent_at: new Date().toISOString(),
        created_by: user.id
      });

    if (dbError) {
      console.error('Error logging Twilio WhatsApp message to database:', dbError);
    }
  } else {
    console.log('Test message - skipping database logging');
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_id: twilioResult.sid,
      status: 'sent',
      twilio_response: twilioResult,
      provider: 'twilio'
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

    // Check Twilio configuration
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    const hasTwilioConfig = twilioAccountSid && twilioAuthToken && twilioPhoneNumber;

    console.log('Configuration check:', {
      hasTwilioConfig: hasTwilioConfig ? 'configured' : 'missing',
      recipient: recipient_phone,
      messageType: message_type || 'text',
      isTest: isTest || false,
      campaignId: campaignId || 'none',
      churchId: churchId || 'none'
    });

    if (!hasTwilioConfig) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your secrets.');
    }

    console.log('Using Twilio for WhatsApp message');
    return await sendViaTwilio(twilioAccountSid, twilioAuthToken, twilioPhoneNumber, {
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