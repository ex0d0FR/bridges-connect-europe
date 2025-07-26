import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  content: string;
  templateId?: string;
  campaignId?: string;
  churchId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, content, message, templateId, campaignId, churchId }: SMSRequest = await req.json();
    
    // Accept both 'content' and 'message' fields for compatibility
    const messageContent = content || message;
    
    // Validate and format content
    if (!messageContent || messageContent.trim() === '') {
      throw new Error('Message content is required');
    }
    
    const formattedContent = messageContent.replace(/undefined/g, '').trim();
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio configuration missing');
    }

    // Get auth header for Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    formData.append('From', twilioPhoneNumber);
    formData.append('To', to);
    formData.append('Body', formattedContent);

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
      throw new Error(`Twilio error: ${errorText}`);
    }

    const twilioData = await twilioResponse.json();
    
    // Log message to database
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