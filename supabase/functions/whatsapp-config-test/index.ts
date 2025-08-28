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

    // Enhanced diagnostics for Twilio WhatsApp
    let twilioStatus = 'not configured';
    let diagnostics = null;
    
    if (twilioConfigComplete) {
      try {
        // Check if this is a sandbox number
        const isSandboxNumber = twilioPhoneNumber.includes('15557932346') || twilioPhoneNumber.includes('14155238886');
        const hasLiveCredentials = twilioAccountSid.startsWith('AC');
        
        diagnostics = {
          phoneNumber: twilioPhoneNumber,
          isSandboxNumber,
          hasLiveCredentials,
          recommendedAction: null
        };
        
        if (isSandboxNumber && hasLiveCredentials) {
          twilioStatus = 'sandbox number with live credentials - incompatible';
          diagnostics.recommendedAction = 'Purchase a WhatsApp Business number or use test credentials';
        } else if (isSandboxNumber) {
          twilioStatus = 'sandbox configured for testing';
          diagnostics.recommendedAction = 'Join WhatsApp sandbox by messaging "join [code]" to +14155238886';
        } else {
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
                twilioStatus = 'connected - WhatsApp capable';
                diagnostics.recommendedAction = 'Complete WhatsApp Business API setup in Twilio Console';
              } else {
                twilioStatus = 'phone number found but no WhatsApp capability';
                diagnostics.recommendedAction = 'Enable WhatsApp capability for this number';
              }
            } else {
              twilioStatus = 'phone number not found in account';
              diagnostics.recommendedAction = 'Verify phone number ownership in Twilio Console';
            }
          } else {
            const errorData = await response.json();
            twilioStatus = `error: ${errorData.message || response.status}`;
            diagnostics.recommendedAction = 'Check Twilio account permissions and phone number configuration';
          }
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
      diagnostics,
      recommendation: twilioConfigComplete && twilioStatus.includes('connected')
        ? 'Twilio WhatsApp is ready to use'
        : diagnostics?.recommendedAction || 'Configure Twilio for WhatsApp messaging'
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