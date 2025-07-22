import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
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
    const { to, subject, content, templateId, campaignId, churchId }: EmailRequest = await req.json();
    
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user ID from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Send email via SendGrid
    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: { email: "noreply@missionarybridges.org", name: "Missionary Bridges" },
      content: [{
        type: "text/html",
        value: content
      }]
    };

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      throw new Error(`SendGrid error: ${errorText}`);
    }

    // Get SendGrid message ID from response headers
    const messageId = sendgridResponse.headers.get('x-message-id') || crypto.randomUUID();

    // Log message to database
    const { error: dbError } = await supabase
      .from('messages')
      .insert({
        type: 'email',
        church_id: churchId,
        campaign_id: campaignId,
        template_id: templateId,
        subject: subject,
        content: content,
        recipient_email: to,
        status: 'sent',
        external_id: messageId,
        sent_at: new Date().toISOString(),
        created_by: user.id
      });

    if (dbError) {
      console.error('Error logging message to database:', dbError);
    }

    console.log(`Email sent successfully to ${to}`);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: messageId 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-email function:', error);
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