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
      } else {
        console.log(`Campaign started with ${campaignChurches?.length || 0} churches`);
      }
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