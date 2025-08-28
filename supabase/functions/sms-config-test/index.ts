import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSConfigTestRequest {
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber }: SMSConfigTestRequest = await req.json();

    // Get auth header for Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user ID from auth using the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Authentication failed');
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioMessagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

    console.log('SMS Configuration test:', {
      hasTwilioAccountSid: !!twilioAccountSid,
      hasTwilioAuthToken: !!twilioAuthToken,
      hasTwilioPhoneNumber: !!twilioPhoneNumber,
      hasTwilioMessagingServiceSid: !!twilioMessagingServiceSid,
      testPhoneNumber: phoneNumber
    });

    // Check basic configuration
    const configResults = {
      twilioCredentials: !!twilioAccountSid && !!twilioAuthToken,
      twilioSender: !!twilioPhoneNumber || !!twilioMessagingServiceSid,
      messagingServiceConfigured: !!twilioMessagingServiceSid,
      phoneNumberConfigured: !!twilioPhoneNumber,
    };

    if (!configResults.twilioCredentials) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
        configCheck: configResults
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (!configResults.twilioSender) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio sender not configured. Please set either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID.',
        configCheck: configResults
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Test sending a message
    const testMessage = 'This is a test SMS from your application. Configuration is working correctly!';
    
    // Send test SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const formData = new URLSearchParams();
    
    // Use Messaging Service SID if available, otherwise use phone number
    if (twilioMessagingServiceSid) {
      formData.append('MessagingServiceSid', twilioMessagingServiceSid);
    } else {
      formData.append('From', twilioPhoneNumber);
    }
    
    // Normalize destination number to E.164 (+countrycode...)
    const cleanedTo = phoneNumber.replace(/[^\d+]/g, '').trim();
    const formattedTo = cleanedTo.startsWith('+') ? cleanedTo : `+${cleanedTo}`;
    formData.append('To', formattedTo);
    formData.append('Body', testMessage);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio test error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // Enhanced error message for common issues
      let enhancedError = `SMS test failed: ${errorData.message || errorText}`;
      
      if (errorData.code === 21659) {
        enhancedError = `Phone number ${twilioPhoneNumber} is not a valid Twilio phone number. This usually means you're using a sandbox number with live credentials, or the number isn't purchased in your Twilio account.`;
      } else if (errorData.code === 21614) {
        enhancedError = `Phone number ${twilioPhoneNumber} is not a mobile number. SMS can only be sent to mobile phones.`;
      } else if (errorData.code === 21408) {
        enhancedError = `Permission denied for phone number ${twilioPhoneNumber}. Check if you have SMS capabilities enabled.`;
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: enhancedError,
        configCheck: configResults,
        twilioStatus: twilioResponse.status,
        twilioError: errorData,
        diagnostics: {
          phoneNumber: twilioPhoneNumber,
          isSandboxNumber: twilioPhoneNumber?.includes('15557932346') || twilioPhoneNumber?.includes('14155238886'),
          hasLiveCredentials: !!twilioAccountSid && twilioAccountSid.startsWith('AC'),
          recommendedAction: twilioPhoneNumber?.includes('15557932346') ? 'Purchase a real phone number or use test credentials' : 'Verify phone number ownership in Twilio Console'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const twilioData = await twilioResponse.json();

    console.log(`SMS test message sent successfully to ${formattedTo}`, {
      messageId: twilioData.sid,
      status: twilioData.status
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'SMS configuration test successful! Test message sent.',
      configCheck: configResults,
      testResults: {
        messageId: twilioData.sid,
        status: twilioData.status,
        recipient: formattedTo,
        sender: twilioMessagingServiceSid ? 'Messaging Service' : twilioPhoneNumber
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in sms-config-test function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);