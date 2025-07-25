import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface CampaignDetails {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  start_date?: string
  end_date?: string
  created_by: string
}

export interface MessageStats {
  total: number
  sent: number
  pending: number
  failed: number
  delivered: number
  opened: number
  clicked: number
  replied: number
  email: number
  sms: number
  whatsapp: number
  messages: any[]
  failedMessages: any[]
}

export interface ChurchStats {
  total: number
}

export interface EngagementStats {
  opened: number
  clicked: number
  replied: number
  openRate: number
  clickRate: number
  replyRate: number
}

export const useCampaignDetails = (campaignId: string) => {
  // Get campaign basic info
  const campaignQuery = useQuery({
    queryKey: ['campaign-details', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('created_by', user.id)
        .single()

      if (error) throw error
      return data as CampaignDetails
    },
    enabled: !!campaignId,
  })

  // Get message statistics
  const messageStatsQuery = useQuery({
    queryKey: ['campaign-message-stats', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get all messages for this campaign
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('created_by', user.id)

      if (error) throw error

      const stats: MessageStats = {
        total: messages.length,
        sent: messages.filter(m => m.status === 'sent').length,
        pending: messages.filter(m => m.status === 'pending').length,
        failed: messages.filter(m => m.status === 'failed').length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        opened: messages.filter(m => m.opened_at !== null).length,
        clicked: messages.filter(m => m.clicked_at !== null).length,
        replied: messages.filter(m => m.replied_at !== null).length,
        email: messages.filter(m => m.type === 'email').length,
        sms: messages.filter(m => m.type === 'sms').length,
        whatsapp: messages.filter(m => m.type === 'whatsapp').length,
        messages: messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        failedMessages: messages.filter(m => m.status === 'failed')
      }

      return stats
    },
    enabled: !!campaignId,
  })

  // Get church count for this campaign
  const churchStatsQuery = useQuery({
    queryKey: ['campaign-church-stats', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('campaign_churches')
        .select('church_id')
        .eq('campaign_id', campaignId)

      if (error) throw error

      const stats: ChurchStats = {
        total: data.length
      }

      return stats
    },
    enabled: !!campaignId,
  })

  // Calculate engagement stats
  const engagementStats: EngagementStats | undefined = messageStatsQuery.data ? {
    opened: messageStatsQuery.data.opened,
    clicked: messageStatsQuery.data.clicked,
    replied: messageStatsQuery.data.replied,
    openRate: messageStatsQuery.data.sent > 0 ? Math.round((messageStatsQuery.data.opened / messageStatsQuery.data.sent) * 100) : 0,
    clickRate: messageStatsQuery.data.sent > 0 ? Math.round((messageStatsQuery.data.clicked / messageStatsQuery.data.sent) * 100) : 0,
    replyRate: messageStatsQuery.data.sent > 0 ? Math.round((messageStatsQuery.data.replied / messageStatsQuery.data.sent) * 100) : 0,
  } : undefined

  return {
    data: campaignQuery.data,
    isLoading: campaignQuery.isLoading || messageStatsQuery.isLoading || churchStatsQuery.isLoading,
    error: campaignQuery.error || messageStatsQuery.error || churchStatsQuery.error,
    messageStats: messageStatsQuery.data,
    churchStats: churchStatsQuery.data,
    engagementStats,
  }
}