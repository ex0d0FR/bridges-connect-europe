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
      
      // Enhanced error analysis using comprehensive error mapping
      const errorCode = errorData.code;
      let enhancedError = `SMS test failed: ${errorData.message || errorText}`;
      let errorCategory = 'unknown';
      let solutions: string[] = [];
      let quickFix: string | undefined;
      
      // Comprehensive error code mapping
      if (errorCode === 21659) {
        enhancedError = `Invalid sender phone number: ${twilioPhoneNumber} is not owned by your Twilio account or doesn't have SMS capabilities.`;
        errorCategory = 'configuration';
        solutions = [
          'Purchase a phone number from Twilio Console',
          'Verify the number in your Twilio account',
          'Use a Messaging Service SID instead',
          'Check if using sandbox number with live credentials'
        ];
        quickFix = 'Purchase a Twilio phone number';
      } else if (errorCode === 21614) {
        enhancedError = `Invalid recipient: ${phoneNumber} is not a mobile number. SMS can only be sent to mobile phones.`;
        errorCategory = 'validation';
        solutions = [
          'Verify the number belongs to a mobile carrier',
          'Use a different mobile number for testing',
          'Check if the number has SMS capabilities'
        ];
      } else if (errorCode === 21408) {
        enhancedError = `Permission denied: You don't have permission to send from ${twilioPhoneNumber}.`;
        errorCategory = 'permissions';
        solutions = [
          'Verify SMS capabilities are enabled for this number',
          'Check number ownership in Twilio Console',
          'Ensure proper account permissions'
        ];
      } else if (errorCode === 21606) {
        enhancedError = `Trial account restriction: Can only send to verified phone numbers. ${phoneNumber} is not verified.`;
        errorCategory = 'permissions';
        solutions = [
          'Add recipient to verified numbers in Twilio Console',
          'Upgrade to a paid Twilio account',
          'Use a verified test number'
        ];
        quickFix = 'Verify recipient number in Twilio Console';
      } else if (errorCode === 21608) {
        enhancedError = `Trial account limitation: Your trial account has restricted messaging capabilities.`;
        errorCategory = 'permissions';
        solutions = [
          'Upgrade to a paid Twilio account',
          'Use only verified phone numbers',
          'Purchase Twilio credits'
        ];
        quickFix = 'Upgrade Twilio account';
      } else if (errorCode === 20001) {
        enhancedError = `Authentication failed: Invalid Twilio credentials (Account SID or Auth Token).`;
        errorCategory = 'configuration';
        solutions = [
          'Verify Account SID and Auth Token in Twilio Console',
          'Check for typos or extra spaces in credentials',
          'Regenerate Auth Token if necessary'
        ];
        quickFix = 'Update Twilio credentials';
      } else if (errorCode === 21212 || errorCode === 21211) {
        enhancedError = `Invalid phone number format: ${phoneNumber} is not a valid phone number.`;
        errorCategory = 'validation';
        solutions = [
          'Use E.164 format (+1234567890)',
          'Remove spaces, dashes, or special characters',
          'Verify the country code is correct'
        ];
      } else if (errorCode === 20003) {
        enhancedError = `Insufficient funds: Your Twilio account doesn't have enough balance to send messages.`;
        errorCategory = 'billing';
        solutions = [
          'Add funds to your Twilio account',
          'Set up auto-recharge',
          'Check current account balance'
        ];
        quickFix = 'Add credits to Twilio account';
      }
      
      // Enhanced diagnostics
      const isSandboxNum = twilioPhoneNumber?.includes('15557932346') || 
                          twilioPhoneNumber?.includes('14155238886') ||
                          twilioPhoneNumber?.includes('15005550006');
      const hasLiveCreds = !!twilioAccountSid && twilioAccountSid.startsWith('AC');
      
      let recommendedAction = 'Review Twilio Console for account status';
      if (isSandboxNum && hasLiveCreds) {
        recommendedAction = 'You\'re using a sandbox number with live credentials. Either purchase a real number or use test credentials.';
      } else if (errorCode === 21659) {
        recommendedAction = 'Purchase a phone number from Twilio or use a Messaging Service';
      } else if (errorCode === 21606 || errorCode === 21608) {
        recommendedAction = 'Upgrade your Twilio account from trial to paid';
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: enhancedError,
        errorCode: errorCode,
        errorCategory: errorCategory,
        solutions: solutions,
        quickFix: quickFix,
        configCheck: configResults,
        twilioStatus: twilioResponse.status,
        twilioError: errorData,
        diagnostics: {
          phoneNumber: twilioPhoneNumber,
          isSandboxNumber: isSandboxNum,
          hasLiveCredentials: hasLiveCreds,
          credentialType: hasLiveCreds ? 'live' : 'test',
          phoneNumberType: isSandboxNum ? 'sandbox' : 'production',
          accountType: hasLiveCreds && (errorCode === 21606 || errorCode === 21608) ? 'trial' : 'unknown',
          recommendedAction: recommendedAction
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