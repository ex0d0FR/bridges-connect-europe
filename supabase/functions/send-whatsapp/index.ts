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

// Detect if using Twilio sandbox or production WhatsApp Business API
function detectWhatsAppEnvironment(phoneNumber: string) {
  const cleanNumber = phoneNumber.replace('whatsapp:', '');
  // Twilio sandbox number is +1 415 523 8886
  const isSandbox = cleanNumber === '+14155238886' || cleanNumber === '+1 415 523 8886' || cleanNumber === '14155238886';
  return { isSandbox, cleanNumber };
}

// Validate Twilio WhatsApp configuration for production accounts
function validateTwilioWhatsAppConfig(accountSid: string, authToken: string, phoneNumber: string) {
  const errors = [];
  
  if (!accountSid) {
    errors.push('TWILIO_ACCOUNT_SID is required');
  }
  
  if (!authToken) {
    errors.push('TWILIO_AUTH_TOKEN is required');
  }
  
  if (!phoneNumber) {
    errors.push('TWILIO_PHONE_NUMBER is required');
  } else {
    const { isSandbox, cleanNumber } = detectWhatsAppEnvironment(phoneNumber);
    
    if (!cleanNumber.startsWith('+')) {
      errors.push('TWILIO_PHONE_NUMBER must include country code with + (e.g., +1234567890)');
    }
    
    // Different validation for sandbox vs production
    if (isSandbox) {
      errors.push('SANDBOX_DETECTED: You are using the Twilio sandbox number (+14155238886). For production use, configure your approved WhatsApp Business number.');
    } else {
      // Production WhatsApp Business API validation
      console.log('Production WhatsApp Business number detected:', cleanNumber);
    }
  }
  
  return errors;
}

// Format phone number for WhatsApp
function formatWhatsAppNumber(phone: string): string {
  // Remove any existing whatsapp: prefix
  let cleanNumber = phone.replace('whatsapp:', '');
  
  // Ensure it starts with +
  if (!cleanNumber.startsWith('+')) {
    // If it doesn't start with +, assume it needs a country code
    console.warn(`Phone number ${cleanNumber} doesn't include country code. This may cause issues.`);
  }
  
  return `whatsapp:${cleanNumber}`;
}

// Evolution API WhatsApp function
async function sendViaEvolutionAPI(
  apiUrl: string,
  apiKey: string,
  instanceName: string,
  messageData: any,
  supabaseClient: any,
  corsHeaders: any
) {
  const { recipient_phone, message_body, isTest, templateId, campaignId, churchId, user } = messageData;

  // Format phone number for Evolution API (remove + and country code)
  let formattedPhone = recipient_phone.replace(/\+/g, '');
  if (!formattedPhone.includes('@')) {
    formattedPhone = `${formattedPhone}@s.whatsapp.net`;
  }

  console.log('Evolution API configuration:', {
    apiUrl,
    instanceName,
    formattedPhone,
    messageLength: message_body.length
  });

  const evolutionEndpoint = `${apiUrl}/message/sendText/${instanceName}`;
  
  const evolutionPayload = {
    number: formattedPhone,
    text: message_body
  };

  console.log('Sending Evolution API WhatsApp message:', {
    endpoint: evolutionEndpoint,
    number: formattedPhone,
    bodyLength: message_body.length
  });

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

    const responseText = await evolutionResponse.text();
    console.log(`Evolution API raw response: ${responseText.substring(0, 200)}`);
    
    try {
      evolutionResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Evolution API returned non-JSON response:', responseText.substring(0, 500));
      throw new Error(`Evolution API returned invalid response: ${responseText.substring(0, 100)}`);
    }

    if (!evolutionResponse.ok) {
      console.error(`Evolution API HTTP error: ${evolutionResponse.status} - ${responseText}`);
      throw new Error(`Evolution API error: ${evolutionResult.message || responseText}`);
    }
  } catch (error) {
    console.error('Evolution API connection error:', error);
    
    if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
      throw new Error(`Cannot connect to Evolution API. Please check your Evolution API configuration and network connection.`);
    } else if (error.message.includes('timeout')) {
      throw new Error(`Evolution API request timeout. Please try again.`);
    } else if (error.message.includes('invalid response') || error.message.includes('HTTP error')) {
      throw error; // Re-throw our custom errors
    } else {
      throw new Error(`Evolution API connection failed: ${error.message}`);
    }
  }

  console.log('Evolution API WhatsApp message sent successfully:', evolutionResult);

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
        external_id: evolutionResult.key?.id || 'evolution-' + Date.now(),
        sent_at: new Date().toISOString(),
        created_by: user.id
      });

    if (dbError) {
      console.error('Error logging Evolution API WhatsApp message to database:', dbError);
    }
  } else {
    console.log('Test message - skipping database logging');
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_id: evolutionResult.key?.id || 'evolution-' + Date.now(),
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

  // Validate configuration and detect environment
  const { isSandbox } = detectWhatsAppEnvironment(fromPhone);
  const configErrors = validateTwilioWhatsAppConfig(accountSid, authToken, fromPhone);
  
  // Only show sandbox warning if using sandbox in production context
  const productionErrors = configErrors.filter(error => !error.includes('SANDBOX_DETECTED'));
  if (productionErrors.length > 0) {
    throw new Error(`Twilio WhatsApp configuration errors:\n${productionErrors.join('\n')}`);
  }
  
  console.log(`WhatsApp Environment: ${isSandbox ? 'Sandbox' : 'Production Business API'}`);
  if (isSandbox) {
    console.log('⚠️ Using Twilio WhatsApp Sandbox - For production, use an approved WhatsApp Business number');
  }

  // Format phone numbers for WhatsApp
  const twilioFromNumber = formatWhatsAppNumber(fromPhone);
  const twilioToNumber = formatWhatsAppNumber(recipient_phone);

  console.log('Using phone numbers:', {
    from: twilioFromNumber,
    to: twilioToNumber,
    originalFrom: fromPhone,
    originalTo: recipient_phone
  });

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
      
      // Handle specific Twilio error codes
      const errorCode = twilioResult.code;
      let errorMessage = twilioResult.message || 'Unknown error';
      const { isSandbox } = detectWhatsAppEnvironment(fromPhone);
      
      if (errorCode === 63007) {
        errorMessage = `WhatsApp Channel Configuration Error (Code 63007): ${twilioResult.message}

The 'From' phone number ${fromPhone} is not configured as a WhatsApp sender in your Twilio account.

IMMEDIATE FIX:
1. Go to Twilio Console: https://console.twilio.com/us1/develop/sms/settings/whatsapp-senders
2. Add your phone number ${fromPhone.replace('whatsapp:', '')} as a WhatsApp sender
3. Or use the Twilio sandbox number +14155238886 for testing

For Sandbox Testing:
- Set TWILIO_PHONE_NUMBER to: +14155238886
- Join sandbox by texting "join [sandbox-name]" to +14155238886

For Production:
- Your phone number must be approved as a WhatsApp Business sender
- Complete WhatsApp Business verification process in Twilio Console
- Ensure your WhatsApp Business Profile is active and approved

Current Configuration:
- Account SID: ${accountSid}
- From Number: ${fromPhone}
- Environment: ${isSandbox ? 'Sandbox' : 'Production'}`;
      } else if (errorCode === 21211) {
        errorMessage = `Invalid phone number: ${twilioResult.message}. Please check the phone number format (must include country code with +)`;
      } else if (errorCode === 21614) {
        errorMessage = `WhatsApp message failed: ${twilioResult.message}. The recipient may not be registered for WhatsApp or may have blocked your number.`;
      } else if (errorCode === 63016) {
        errorMessage = `WhatsApp Business API Template Error: ${twilioResult.message}. Check if your message template is approved and properly formatted.`;
      } else if (errorCode === 63015) {
        errorMessage = `WhatsApp Number Not Approved: ${twilioResult.message}. Your WhatsApp Business number needs approval from WhatsApp Business API.`;
      }
      
      throw new Error(errorMessage);
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

    // Check Evolution API configuration
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionInstanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');

    // Check Twilio configuration
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    const hasEvolutionConfig = evolutionApiUrl && evolutionApiKey && evolutionInstanceName;
    const hasTwilioConfig = twilioAccountSid && twilioAuthToken && twilioPhoneNumber;

    console.log('Configuration check:', {
      provider: provider,
      hasEvolutionConfig: hasEvolutionConfig ? 'configured' : 'missing',
      hasTwilioConfig: hasTwilioConfig ? 'configured' : 'missing',
      recipient: recipient_phone,
      messageType: message_type || 'text',
      isTest: isTest || false,
      campaignId: campaignId || 'none',
      churchId: churchId || 'none'
    });

    // Use Evolution API if provider is 'evolution' and it's configured
    if (provider === 'evolution') {
      if (!hasEvolutionConfig) {
        throw new Error('Evolution API credentials not configured. Please set EVOLUTION_API_URL, EVOLUTION_API_KEY, and EVOLUTION_INSTANCE_NAME in your secrets.');
      }
      
      console.log('Using Evolution API for WhatsApp message');
      return await sendViaEvolutionAPI(evolutionApiUrl, evolutionApiKey, evolutionInstanceName, {
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
    }

    // Default to Twilio if no provider specified or provider is 'whatsapp'
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