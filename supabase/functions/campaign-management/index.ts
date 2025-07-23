import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignAction {
  action: 'start' | 'pause' | 'stop' | 'schedule';
  campaignId: string;
  scheduleTime?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, campaignId, scheduleTime }: CampaignAction = await req.json();
    
    // Get auth header for Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://ovoldtknfdyvyypadnmf.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2xkdGtuZmR5dnl5cGFkbm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzc5NDUsImV4cCI6MjA2ODcxMzk0NX0.9uwPMIYk88gx_NcKp91QxF7xS44E7q4UDJwRgoYspk0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user ID from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('created_by', user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found or access denied');
    }

    let newStatus: string;
    let updateData: any = {};

    switch (action) {
      case 'start':
        newStatus = 'active';
        updateData = {
          status: newStatus,
          start_date: new Date().toISOString()
        };
        break;
      case 'pause':
        newStatus = 'paused';
        updateData = { status: newStatus };
        break;
      case 'stop':
        newStatus = 'completed';
        updateData = {
          status: newStatus,
          end_date: new Date().toISOString()
        };
        break;
      case 'schedule':
        if (!scheduleTime) {
          throw new Error('Schedule time required for schedule action');
        }
        newStatus = 'scheduled';
        updateData = {
          status: newStatus,
          start_date: scheduleTime
        };
        break;
      default:
        throw new Error('Invalid action');
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .eq('created_by', user.id);

    if (updateError) {
      throw new Error(`Failed to update campaign: ${updateError.message}`);
    }

    // If starting campaign, process campaign churches for messaging
    if (action === 'start') {
      const { data: campaignChurches, error: churchesError } = await supabase
        .from('campaign_churches')
        .select(`
          church_id,
          churches (
            id,
            name,
            email,
            phone,
            contact_name
          )
        `)
        .eq('campaign_id', campaignId);

      if (churchesError) {
        console.error('Error fetching campaign churches:', churchesError);
        throw new Error(`Failed to fetch campaign churches: ${churchesError.message}`);
      }

      if (!campaignChurches || campaignChurches.length === 0) {
        throw new Error('No churches assigned to this campaign. Please add churches before launching.');
      }

      // For now, we'll use a default template since campaigns don't have template_id yet
      // This should be improved to link campaigns to specific templates
      const { data: templates, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('created_by', user.id)
        .limit(1);

      if (templateError || !templates?.length) {
        console.error('Error fetching template:', templateError);
        throw new Error('No template found. Please create a template first before launching a campaign.');
      }

      const template = templates[0];
      console.log(`Starting to send ${template.type} messages to ${campaignChurches.length} churches`);

      // Process each church and send messages
      let successCount = 0;
      let failureCount = 0;

      for (const campaignChurch of campaignChurches) {
        const church = campaignChurch.churches;
        if (!church) continue;

        try {
          let messageData: any = {
            campaign_id: campaignId,
            church_id: church.id,
            template_id: template.id,
            type: template.type,
            content: template.content,
            subject: template.subject,
            created_by: user.id,
            status: 'pending'
          };

          // Set recipient based on message type
          if (template.type === 'email' && church.email) {
            messageData.recipient_email = church.email;
          } else if ((template.type === 'sms' || template.type === 'whatsapp') && church.phone) {
            messageData.recipient_phone = church.phone;
          } else {
            console.log(`Skipping church ${church.name} - no ${template.type} contact info`);
            continue;
          }

          // Insert message record
          const { data: messageRecord, error: messageError } = await supabase
            .from('messages')
            .insert([messageData])
            .select()
            .single();

          if (messageError) {
            console.error(`Error creating message record for church ${church.name}:`, messageError);
            failureCount++;
            continue;
          }

          // Send the actual message based on type
          if (template.type === 'email') {
            const { error: emailError } = await supabase.functions.invoke('send-email', {
              body: {
                to: church.email,
                subject: template.subject || `Message from ${campaign.name}`,
                content: template.content,
                messageId: messageRecord.id
              }
            });

            if (emailError) {
              console.error(`Error sending email to ${church.name}:`, emailError);
              await supabase
                .from('messages')
                .update({ status: 'failed', failed_reason: emailError.message })
                .eq('id', messageRecord.id);
              failureCount++;
            } else {
              await supabase
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageRecord.id);
              successCount++;
            }
          } else if (template.type === 'sms') {
            const { error: smsError } = await supabase.functions.invoke('send-sms', {
              body: {
                to: church.phone,
                message: template.content,
                messageId: messageRecord.id
              }
            });

            if (smsError) {
              console.error(`Error sending SMS to ${church.name}:`, smsError);
              await supabase
                .from('messages')
                .update({ status: 'failed', failed_reason: smsError.message })
                .eq('id', messageRecord.id);
              failureCount++;
            } else {
              await supabase
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageRecord.id);
              successCount++;
            }
          } else if (template.type === 'whatsapp') {
            const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
              body: {
                to: church.phone,
                message: template.content,
                messageId: messageRecord.id
              }
            });

            if (whatsappError) {
              console.error(`Error sending WhatsApp to ${church.name}:`, whatsappError);
              await supabase
                .from('messages')
                .update({ status: 'failed', failed_reason: whatsappError.message })
                .eq('id', messageRecord.id);
              failureCount++;
            } else {
              await supabase
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageRecord.id);
              successCount++;
            }
          }
        } catch (error: any) {
          console.error(`Error processing church ${church.name}:`, error);
          failureCount++;
        }
      }

      console.log(`Campaign ${campaignId} completed: ${successCount} sent, ${failureCount} failed`);
    }

    console.log(`Campaign ${campaignId} ${action} completed successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      campaignId,
      action,
      newStatus 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in campaign-management function:', error);
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