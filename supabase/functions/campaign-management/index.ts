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
    
    // Get auth header and extract JWT token
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header received:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid authorization header found');
      throw new Error('No valid authorization header provided');
    }

    // Extract JWT token from "Bearer ..." header
    const jwt = authHeader.replace('Bearer ', '');
    console.log('JWT token extracted:', jwt ? 'yes' : 'no');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://ovoldtknfdyvyypadnmf.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    
    // Create Supabase client with service role key for server operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Verify JWT and get user data
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    console.log('User data:', user ? { id: user.id, email: user.email } : 'null');
    console.log('Auth error:', authError);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      throw new Error(`Authentication failed: ${authError?.message || 'No user found'}`);
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (campaignError) {
      console.error('Campaign query error:', campaignError);
      throw new Error(`Campaign query failed: ${campaignError.message}`);
    }

    if (!campaign) {
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
        console.log(`Campaign ${campaignId} has no churches assigned`)
        throw new Error('No churches assigned to this campaign. Please add churches before launching.');
      }

      console.log(`Found ${campaignChurches.length} churches for campaign ${campaignId}`)

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

      // Helper to check latest campaign status so pause/stop can take effect mid-run
      const getCampaignStatus = async (): Promise<string | null> => {
        const { data: statusRow, error: statusError } = await supabase
          .from('campaigns')
          .select('status')
          .eq('id', campaignId)
          .single();
        if (statusError) {
          console.error('Error checking campaign status:', statusError);
          return null;
        }
        return statusRow?.status ?? null;
      };

      // Process each church and send messages with pause/resume/stop support and de-duplication
      let successCount = 0;
      let failureCount = 0;

      for (const campaignChurch of campaignChurches) {
        const church = campaignChurch.churches;
        if (!church) continue;

        // Check status before processing each church
        const currentStatus = await getCampaignStatus();
        if (currentStatus && currentStatus !== 'active') {
          console.log(`Halting send loop: campaign is ${currentStatus}`);
          break;
        }

        try {
          // Determine recipient info and skip if unavailable
          let recipientEmail: string | undefined;
          let recipientPhone: string | undefined;
          if (template.type === 'email') recipientEmail = church.email || undefined;
          if (template.type === 'sms' || template.type === 'whatsapp') recipientPhone = church.phone || undefined;
          if ((template.type === 'email' && !recipientEmail) || ((template.type === 'sms' || template.type === 'whatsapp') && !recipientPhone)) {
            console.log(`Skipping church ${church.name} - no ${template.type} contact info`);
            continue;
          }

          // Find existing message for this campaign/church/template to avoid duplicates
          const { data: existingMessage, error: existingError } = await supabase
            .from('messages')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('church_id', church.id)
            .eq('template_id', template.id)
            .maybeSingle();
          if (existingError) {
            console.error('Error checking existing message:', existingError);
          }

          // Build/ensure message record
          let messageId: string | null = existingMessage?.id ?? null;
          let messageStatus = existingMessage?.status as string | undefined;

          if (existingMessage && messageStatus === 'sent') {
            // Already sent, skip
            continue;
          }

          if (!messageId) {
            const { data: inserted, error: insertError } = await supabase
              .from('messages')
              .insert([{
                campaign_id: campaignId,
                church_id: church.id,
                template_id: template.id,
                type: template.type,
                content: template.content,
                subject: template.subject,
                created_by: user.id,
                status: 'pending',
                recipient_email: recipientEmail,
                recipient_phone: recipientPhone,
              }])
              .select()
              .single();
            if (insertError) {
              console.error(`Error creating message record for church ${church.name}:`, insertError);
              failureCount++;
              continue;
            }
            messageId = inserted.id;
          }

          // Check status again right before sending to respect recent pauses/stops
          const statusBeforeSend = await getCampaignStatus();
          if (statusBeforeSend && statusBeforeSend !== 'active') {
            console.log(`Aborting send for church ${church.name}: campaign is ${statusBeforeSend}`);
            break;
          }

          // Send the actual message based on type
          if (template.type === 'email') {
            const { error: emailError } = await supabase.functions.invoke('send-email', {
              headers: { 'Authorization': authHeader },
              body: {
                to: recipientEmail,
                subject: template.subject || `Message from ${campaign.name}`,
                content: template.content,
                templateId: template.id,
                campaignId: campaign.id,
                churchId: church.id,
              }
            });

            if (emailError) {
              console.error(`Error sending email to ${church.name}:`, emailError);
              await supabase
                .from('messages')
                .update({ status: 'failed', failed_reason: emailError.message })
                .eq('id', messageId!);
              failureCount++;
            } else {
              await supabase
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageId!);
              successCount++;
            }
          } else if (template.type === 'sms') {
            const { error: smsError } = await supabase.functions.invoke('send-sms', {
              headers: { 'Authorization': authHeader },
              body: {
                to: recipientPhone,
                content: template.content,
                templateId: template.id,
                campaignId: campaign.id,
                churchId: church.id,
              }
            });

            if (smsError) {
              console.error(`Error sending SMS to ${church.name}:`, smsError);
              await supabase
                .from('messages')
                .update({ status: 'failed', failed_reason: smsError.message || `SMS sending failed for ${church.name}` })
                .eq('id', messageId!);
              failureCount++;
            } else {
              await supabase
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageId!);
              successCount++;
            }
          } else if (template.type === 'whatsapp') {
            console.log(`Sending WhatsApp message to church ${church.id}, phone: ${recipientPhone}`);
            const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
              headers: { 'Authorization': authHeader },
              body: {
                recipient_phone: recipientPhone,
                message_body: template.content,
                message_type: 'text',
                provider: 'twilio',
                templateId: template.id,
                campaignId: campaign.id,
                churchId: church.id,
              }
            });

            if (whatsappError) {
              console.error(`Error sending WhatsApp to ${church.name}:`, whatsappError);
              await supabase
                .from('messages')
                .update({ status: 'failed', failed_reason: whatsappError.message || `WhatsApp sending failed for ${church.name}` })
                .eq('id', messageId!);
              failureCount++;
            } else {
              await supabase
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageId!);
              successCount++;
            }
          }
        } catch (error: any) {
          console.error(`Error processing church ${church.name}:`, error);
          failureCount++;
        }
      }

      console.log(`Campaign ${campaignId} send loop finished: ${successCount} sent, ${failureCount} failed`);
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