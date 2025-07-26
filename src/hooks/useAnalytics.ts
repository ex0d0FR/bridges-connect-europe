import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsRequest {
  type: 'campaign_stats' | 'message_stats' | 'church_stats' | 'engagement_stats';
  campaignId?: string;
  timeframe?: '7d' | '30d' | '90d' | 'all';
}

interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  draft_campaigns: number;
  completed_campaigns: number;
  campaigns: any[];
}

interface MessageStats {
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  opened_messages: number;
  clicked_messages: number;
  replied_messages: number;
  email_messages: number;
  sms_messages: number;
  whatsapp_messages: number;
}

interface ChurchStats {
  total_churches: number;
  verified_churches: number;
  churches_by_country: Record<string, number>;
  churches_by_denomination: Record<string, number>;
}

interface EngagementStats {
  open_rate: string;
  click_rate: string;
  reply_rate: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
}

const fetchAnalytics = async (request: AnalyticsRequest): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('analytics', {
    body: request
  });

  if (error) throw error;
  return data.analytics;
};

export const useCampaignStats = (timeframe: '7d' | '30d' | '90d' | 'all' = '30d') => {
  return useQuery<CampaignStats>({
    queryKey: ['analytics', 'campaign_stats', timeframe],
    queryFn: () => fetchAnalytics({ type: 'campaign_stats', timeframe }),
  });
};

export const useMessageStats = (campaignId?: string, timeframe: '7d' | '30d' | '90d' | 'all' = '30d') => {
  return useQuery<MessageStats>({
    queryKey: ['analytics', 'message_stats', campaignId, timeframe],
    queryFn: () => fetchAnalytics({ type: 'message_stats', campaignId, timeframe }),
  });
};

export const useChurchStats = (timeframe: '7d' | '30d' | '90d' | 'all' = '30d') => {
  return useQuery<ChurchStats>({
    queryKey: ['analytics', 'church_stats', timeframe],
    queryFn: () => fetchAnalytics({ type: 'church_stats', timeframe }),
  });
};

export const useEngagementStats = (timeframe: '7d' | '30d' | '90d' | 'all' = '30d') => {
  return useQuery<EngagementStats>({
    queryKey: ['analytics', 'engagement_stats', timeframe],
    queryFn: () => fetchAnalytics({ type: 'engagement_stats', timeframe }),
  });
};