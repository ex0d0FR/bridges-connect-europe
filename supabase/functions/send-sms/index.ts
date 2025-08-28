import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  content: string;
  message?: string; // Alternative field name for compatibility
  templateId?: string;
  campaignId?: string;
  churchId?: string;
  isTest?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Enhanced input validation
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Invalid request body');
    }

    const { to, content, message, templateId, campaignId, churchId, isTest } = requestBody;
    
    // Accept both 'content' and 'message' fields for compatibility
    const messageContent = content || message;
    
    // Validate and format content with enhanced security
    if (!messageContent || typeof messageContent !== 'string' || messageContent.trim() === '') {
      throw new Error('Message content is required');
    }
    
    // SMS content length validation (160 chars standard, 1600 for concatenated)
    if (messageContent.length > 1600) {
      throw new Error('SMS content too long (max 1600 characters)');
    }
    
    // Validate phone number
    if (!to || typeof to !== 'string' || to.trim() === '') {
      throw new Error('Recipient phone number is required');
    }
    
    if (to.length > 20) {
      throw new Error('Phone number too long');
    }
    
    // Basic phone number format validation
    const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;
    if (!phoneRegex.test(to)) {
      throw new Error('Invalid phone number format');
    }
    
    // Sanitize content - remove potentially harmful content
    const formattedContent = messageContent
      .replace(/undefined/g, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:|data:|vbscript:/gi, '') // Remove dangerous protocols
      .trim();
      
    if (formattedContent.length === 0) {
      throw new Error('Message content is empty after sanitization');
    }
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioMessagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
    
    console.log('SMS Configuration check:', {
      hasTwilioAccountSid: !!twilioAccountSid,
      hasTwilioAuthToken: !!twilioAuthToken,
      hasTwilioPhoneNumber: !!twilioPhoneNumber,
      hasTwilioMessagingServiceSid: !!twilioMessagingServiceSid,
      recipient: to,
      isTest: !!isTest
    });
    
    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio credentials missing: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
    }
    
    if (!twilioPhoneNumber && !twilioMessagingServiceSid) {
      throw new Error('Twilio sender configuration missing: Either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID is required');
    }

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

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const formData = new URLSearchParams();
    
    // Use Messaging Service SID if available, otherwise use phone number
    if (twilioMessagingServiceSid) {
      formData.append('MessagingServiceSid', twilioMessagingServiceSid);
      console.log('Using Twilio Messaging Service SID');
    } else {
      formData.append('From', twilioPhoneNumber);
      console.log('Using Twilio phone number');
    }
    
    // Normalize destination number to E.164 (+countrycode...)
    const cleanedTo = to.replace(/[^\d+]/g, '').trim();
    const formattedTo = cleanedTo.startsWith('+') ? cleanedTo : `+${cleanedTo}`;
    formData.append('To', formattedTo);
    formData.append('Body', formattedContent);
    
    console.log(`Sending SMS to ${formattedTo}`);

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
      console.error('Twilio API error response:', errorText);
      throw new Error(`Twilio error (${twilioResponse.status}): ${errorText}`);
    }

    const twilioData = await twilioResponse.json();
    
    // Log message to database only if not a test and churchId is provided and valid
    if (!isTest && churchId && churchId !== '00000000-0000-0000-0000-000000000000') {
      // Verify church exists before logging
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id')
        .eq('id', churchId)
        .single();

      if (!churchError && church) {
        const { error: dbError } = await supabase
          .from('messages')
          .insert({
            type: 'sms',
            church_id: churchId,
            campaign_id: campaignId,
            template_id: templateId,
            content: formattedContent,
            recipient_phone: to,
            status: twilioData.status === 'queued' ? 'sent' : 'failed',
            external_id: twilioData.sid,
            sent_at: new Date().toISOString(),
            created_by: user.id
          });

        if (dbError) {
          console.error('Error logging message to database:', dbError);
        }
      } else {
        console.warn(`Church ID ${churchId} not found, skipping database logging`);
      }
    } else if (!isTest) {
      console.warn('Invalid or missing church ID, skipping database logging');
    } else {
      console.log('Test message - skipping database logging');
    }

    console.log(`SMS sent successfully to ${to}`);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: twilioData.sid,
      status: twilioData.status 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);