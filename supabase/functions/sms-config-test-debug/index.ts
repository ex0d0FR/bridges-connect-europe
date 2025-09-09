import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    console.log('🧪 DEBUG SMS Configuration test:', {
      testPhoneNumber: phoneNumber
    });

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioMessagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

    console.log('🔍 Environment Variables Check:', {
      hasTwilioAccountSid: !!twilioAccountSid,
      twilioAccountSidLength: twilioAccountSid?.length || 0,
      twilioAccountSidPrefix: twilioAccountSid?.substring(0, 2) || 'none',
      hasTwilioAuthToken: !!twilioAuthToken,
      twilioAuthTokenLength: twilioAuthToken?.length || 0,
      hasTwilioPhoneNumber: !!twilioPhoneNumber,
      twilioPhoneNumber: twilioPhoneNumber || 'not set',
      hasTwilioMessagingServiceSid: !!twilioMessagingServiceSid,
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
        error: 'DEBUG: Twilio credentials not found in environment variables',
        configCheck: configResults,
        debug: {
          accountSidExists: !!twilioAccountSid,
          authTokenExists: !!twilioAuthToken,
          accountSidFormat: twilioAccountSid ? 'valid format' : 'missing',
          authTokenFormat: twilioAuthToken ? 'valid format' : 'missing'
        }
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
        error: 'DEBUG: No Twilio sender configured (need phone number or messaging service)',
        configCheck: configResults,
        debug: {
          phoneNumberExists: !!twilioPhoneNumber,
          messagingServiceExists: !!twilioMessagingServiceSid,
          phoneNumberValue: twilioPhoneNumber || 'not set',
          messagingServiceValue: twilioMessagingServiceSid || 'not set'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Test sending a message
    const testMessage = 'DEBUG: This is a test SMS from your Bridges Connect Europe application. Configuration is working correctly!';
    
    // Send test SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const formData = new URLSearchParams();
    
    // Use Messaging Service SID if available, otherwise use phone number
    if (twilioMessagingServiceSid) {
      formData.append('MessagingServiceSid', twilioMessagingServiceSid);
      console.log('📨 Using Messaging Service:', twilioMessagingServiceSid);
    } else {
      formData.append('From', twilioPhoneNumber);
      console.log('📞 Using Phone Number:', twilioPhoneNumber);
    }
    
    // Normalize destination number to E.164 (+countrycode...)
    const cleanedTo = phoneNumber.replace(/[^\d+]/g, '').trim();
    const formattedTo = cleanedTo.startsWith('+') ? cleanedTo : `+${cleanedTo}`;
    formData.append('To', formattedTo);
    formData.append('Body', testMessage);

    console.log('📤 Sending SMS with params:', {
      to: formattedTo,
      from: twilioMessagingServiceSid ? 'Messaging Service' : twilioPhoneNumber,
      messageLength: testMessage.length
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const responseText = await twilioResponse.text();
    console.log('📊 Twilio API Response:', {
      status: twilioResponse.status,
      statusText: twilioResponse.statusText,
      responseLength: responseText.length
    });

    if (!twilioResponse.ok) {
      console.error('❌ Twilio API Error:', responseText);
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: `DEBUG: Twilio API Error - ${errorData.message || responseText}`,
        configCheck: configResults,
        twilioStatus: twilioResponse.status,
        twilioError: errorData,
        debug: {
          twilioUrl: twilioUrl,
          accountSidUsed: twilioAccountSid?.substring(0, 10) + '...',
          authTokenUsed: twilioAuthToken ? 'provided' : 'missing',
          phoneNumberUsed: twilioPhoneNumber,
          messagingServiceUsed: twilioMessagingServiceSid,
          formattedDestination: formattedTo
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const twilioData = JSON.parse(responseText);

    console.log('✅ SMS sent successfully:', {
      messageId: twilioData.sid,
      status: twilioData.status,
      to: formattedTo
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'DEBUG: SMS configuration test successful! Test message sent.',
      configCheck: configResults,
      testResults: {
        messageId: twilioData.sid,
        status: twilioData.status,
        recipient: formattedTo,
        sender: twilioMessagingServiceSid ? 'Messaging Service' : twilioPhoneNumber
      },
      debug: {
        twilioResponseStatus: twilioResponse.status,
        messageSent: true,
        configurationValid: true
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('💥 Unexpected error in debug SMS function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `DEBUG: Unexpected error - ${error.message}`,
        debug: {
          errorType: error.constructor.name,
          errorStack: error.stack
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);