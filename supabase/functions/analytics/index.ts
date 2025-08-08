import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  type: 'campaign_stats' | 'message_stats' | 'church_stats' | 'engagement_stats';
  campaignId?: string;
  timeframe?: '7d' | '30d' | '90d' | 'all';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, campaignId, timeframe = '30d' }: AnalyticsRequest = await req.json();
    
    // Get auth header for Supabase
    const authHeader = req.headers.get('Authorization');
    console.log('Analytics: Auth header received:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.error('Analytics: No authorization header found');
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Analytics: Supabase configuration missing', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseAnonKey 
      });
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user ID from auth using JWT from header
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    console.log('Analytics: User data:', user ? { id: user.id, email: user.email } : 'null');
    console.log('Analytics: Auth error:', authError);
    
    if (authError || !user) {
      console.error('Analytics: Authentication failed:', authError?.message || 'No user found');
      throw new Error(`Authentication failed: ${authError?.message || 'No user found'}`);
    }

    let analytics: any = {};

    switch (type) {
      case 'campaign_stats':
        const { data: campaigns, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, status, created_at')
          .eq('created_by', user.id);

        if (campaignError) throw campaignError;

        analytics = {
          total_campaigns: campaigns?.length || 0,
          active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
          draft_campaigns: campaigns?.filter(c => c.status === 'draft').length || 0,
          completed_campaigns: campaigns?.filter(c => c.status === 'completed').length || 0,
          campaigns: campaigns
        };
        break;

      case 'message_stats':
        let messageQuery = supabase
          .from('messages')
          .select('*')
          .eq('created_by', user.id);

        if (campaignId) {
          messageQuery = messageQuery.eq('campaign_id', campaignId);
        }

        const { data: messages, error: messageError } = await messageQuery;

        if (messageError) throw messageError;

        analytics = {
          total_messages: messages?.length || 0,
          sent_messages: messages?.filter(m => m.status === 'sent').length || 0,
          delivered_messages: messages?.filter(m => m.status === 'delivered').length || 0,
          opened_messages: messages?.filter(m => m.opened_at).length || 0,
          clicked_messages: messages?.filter(m => m.clicked_at).length || 0,
          replied_messages: messages?.filter(m => m.replied_at).length || 0,
          email_messages: messages?.filter(m => m.type === 'email').length || 0,
          sms_messages: messages?.filter(m => m.type === 'sms').length || 0,
          whatsapp_messages: messages?.filter(m => m.type === 'whatsapp').length || 0
        };
        break;

      case 'church_stats':
        const { data: churches, error: churchError } = await supabase
          .from('churches')
          .select('*')
          .eq('created_by', user.id);

        if (churchError) throw churchError;

        analytics = {
          total_churches: churches?.length || 0,
          verified_churches: churches?.filter(c => c.verified).length || 0,
          churches_by_country: churches?.reduce((acc: any, church) => {
            acc[church.country] = (acc[church.country] || 0) + 1;
            return acc;
          }, {}),
          churches_by_denomination: churches?.reduce((acc: any, church) => {
            if (church.denomination) {
              acc[church.denomination] = (acc[church.denomination] || 0) + 1;
            }
            return acc;
          }, {})
        };
        break;

      case 'engagement_stats':
        const { data: engagementMessages, error: engagementError } = await supabase
          .from('messages')
          .select('*')
          .eq('created_by', user.id)
          .not('sent_at', 'is', null);

        if (engagementError) throw engagementError;

        const totalSent = engagementMessages?.length || 0;
        const totalOpened = engagementMessages?.filter(m => m.opened_at).length || 0;
        const totalClicked = engagementMessages?.filter(m => m.clicked_at).length || 0;
        const totalReplied = engagementMessages?.filter(m => m.replied_at).length || 0;

        analytics = {
          open_rate: totalSent > 0 ? (totalOpened / totalSent * 100).toFixed(2) : '0.00',
          click_rate: totalSent > 0 ? (totalClicked / totalSent * 100).toFixed(2) : '0.00',
          reply_rate: totalSent > 0 ? (totalReplied / totalSent * 100).toFixed(2) : '0.00',
          total_sent: totalSent,
          total_opened: totalOpened,
          total_clicked: totalClicked,
          total_replied: totalReplied
        };
        break;

      default:
        throw new Error('Invalid analytics type');
    }

    console.log(`Analytics request processed: ${type}`);

    return new Response(JSON.stringify({ 
      success: true,
      type,
      analytics 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in analytics function:', error);
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