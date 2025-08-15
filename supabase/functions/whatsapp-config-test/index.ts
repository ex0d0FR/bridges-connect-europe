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
    // Get Twilio WhatsApp configuration variables
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    // Check Twilio configuration
    const twilioConfigComplete = twilioAccountSid && twilioAuthToken && twilioPhoneNumber;

    // Test Twilio WhatsApp connection if configured
    let twilioStatus = 'not configured';
    if (twilioConfigComplete) {
      try {
        // Test by attempting to validate the phone number via Twilio's API
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(twilioPhoneNumber)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.incoming_phone_numbers && data.incoming_phone_numbers.length > 0) {
            const phoneNumberData = data.incoming_phone_numbers[0];
            // Check if it has WhatsApp capabilities
            if (phoneNumberData.capabilities && phoneNumberData.capabilities.mms) {
              twilioStatus = 'connected';
            } else {
              twilioStatus = 'configured but no WhatsApp capability';
            }
          } else {
            twilioStatus = 'phone number not found in account';
          }
        } else {
          const errorData = await response.json();
          twilioStatus = `error: ${errorData.message || response.status}`;
        }
      } catch (error) {
        twilioStatus = `connection failed: ${error.message}`;
      }
    }

    const configStatus = {
      twilio: {
        configured: twilioConfigComplete,
        status: twilioStatus,
        phoneNumber: twilioPhoneNumber || null,
        details: {
          hasAccountSid: !!twilioAccountSid,
          hasAuthToken: !!twilioAuthToken,
          hasPhoneNumber: !!twilioPhoneNumber,
        }
      },
      recommendation: twilioConfigComplete && twilioStatus === 'connected'
        ? 'Twilio WhatsApp is ready to use'
        : 'Configure Twilio for WhatsApp messaging'
    };

    return new Response(JSON.stringify(configStatus), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error('Error in whatsapp-config-test function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);