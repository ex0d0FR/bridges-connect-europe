import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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

export const useRetryFailedMessages = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaignId, messageId }: { campaignId: string, messageId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get failed messages (either specific message or all failed messages for campaign)
      let query = supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'failed')
        .eq('created_by', user.id)

      if (messageId) {
        query = query.eq('id', messageId)
      }

      const { data: failedMessages, error } = await query

      if (error) throw error
      if (!failedMessages || failedMessages.length === 0) {
        throw new Error('No failed messages found')
      }

      // Retry each failed message
      const retryPromises = failedMessages.map(async (message) => {
        try {
          let functionName = ''
          let requestBody: any = {}

          switch (message.type) {
            case 'email':
              functionName = 'send-email'
              requestBody = {
                to: message.recipient_email,
                subject: message.subject,
                content: message.content,
                templateId: message.template_id,
                campaignId: message.campaign_id,
                churchId: message.church_id
              }
              break
            case 'sms':
              functionName = 'send-sms'
              requestBody = {
                to: message.recipient_phone,
                content: message.content,
                templateId: message.template_id,
                campaignId: message.campaign_id,
                churchId: message.church_id
              }
              break
            case 'whatsapp':
              functionName = 'send-whatsapp'
              requestBody = {
                recipient_phone: message.recipient_phone,
                message_body: message.content,
                message_type: 'text',
                templateId: message.template_id,
                campaignId: message.campaign_id,
                churchId: message.church_id
              }
              break
            default:
              throw new Error(`Unsupported message type: ${message.type}`)
          }

          const { error: retryError } = await supabase.functions.invoke(functionName, {
            body: requestBody
          })

          if (retryError) {
            console.error(`Failed to retry message ${message.id}:`, retryError)
            return { success: false, messageId: message.id, error: retryError }
          }

          return { success: true, messageId: message.id }
        } catch (error) {
          console.error(`Error retrying message ${message.id}:`, error)
          return { success: false, messageId: message.id, error }
        }
      })

      const results = await Promise.all(retryPromises)
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        toast({
          title: "Messages Retried",
          description: `${successCount} message(s) queued for retry${failCount > 0 ? `, ${failCount} failed` : ''}`,
        })
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: "Retry Failed",
          description: "Failed to retry messages. Please check your configuration.",
          variant: "destructive",
        })
      }

      // Refetch campaign data
      queryClient.invalidateQueries({ queryKey: ['campaign-details'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-message-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry messages",
        variant: "destructive",
      })
    },
  })
}