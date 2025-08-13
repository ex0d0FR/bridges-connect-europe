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
  isTest?: boolean;
}

const formatEmailContent = (content: string): string => {
  // Check if content is already HTML
  const isHTML = /<[a-z][\s\S]*>/i.test(content);
  
  if (isHTML) {
    return content;
  }
  
  // Convert plain text to HTML
  let htmlContent = content
    // Convert double line breaks to paragraph breaks
    .replace(/\n\n/g, '</p><p>')
    // Convert single line breaks to <br>
    .replace(/\n/g, '<br>')
    // Remove any "undefined" text that might appear
    .replace(/undefined/g, '');
  
  // Wrap in a proper HTML email template
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          p {
            margin: 0 0 16px 0;
          }
          .email-content {
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="email-content">
          <p>${htmlContent}</p>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content, templateId, campaignId, churchId, isTest }: EmailRequest = await req.json();
    
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

    // Format content properly for email
    const formattedContent = formatEmailContent(content);

    // Send email via SendGrid
    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: { email: "info@puentesparis2025.net", name: "Missionary Bridges" },
      content: [{
        type: "text/html",
        value: formattedContent
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

    // Log message to database only if not a test and churchId is provided and valid
    if (!isTest && churchId && churchId !== '00000000-0000-0000-0000-000000000000') {
      // Verify church exists before logging (service role bypasses RLS)
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id')
        .eq('id', churchId)
        .single();

      if (!churchError && church) {
        const { error: dbError } = await supabase
          .from('messages')
          .insert({
            type: 'email',
            church_id: churchId,
            campaign_id: campaignId,
            template_id: templateId,
            subject: subject,
            content: formattedContent,
            recipient_email: to,
            status: 'sent',
            external_id: messageId,
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