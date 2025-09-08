import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  church_id: string
  role: 'primary' | 'secondary' | 'leader' | 'admin'
  engagement_score: number
  last_interaction_date?: string
  notes?: string
  created_at: string
  contacts?: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    mobile?: string
    position?: string
    church_id?: string
  }
  churches?: {
    id: string
    name: string
    contact_name?: string
    email?: string
    phone?: string
  }
}

export const useCampaignContacts = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-contacts', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('campaign_contacts')
        .select(`
          *,
          contacts (*),
          churches (id, name, contact_name, email, phone)
        `)
        .eq('campaign_id', campaignId)
        .order('engagement_score', { ascending: false })

      if (error) throw error
      return data as CampaignContact[]
    },
    enabled: !!campaignId,
  })
}

export const useAvailableContacts = (campaignId: string) => {
  return useQuery({
    queryKey: ['available-contacts', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get contacts that are not already in the campaign
      const { data: existingContacts } = await supabase
        .from('campaign_contacts')
        .select('contact_id')
        .eq('campaign_id', campaignId)

      const existingContactIds = existingContacts?.map(c => c.contact_id) || []

      let query = supabase
        .from('contacts')
        .select(`
          *,
          churches (id, name)
        `)
        .eq('created_by', user.id)

      if (existingContactIds.length > 0) {
        query = query.not('id', 'in', `(${existingContactIds.join(',')})`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!campaignId,
  })
}

export const useAddCampaignContact = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      contactId, 
      churchId, 
      role = 'primary' 
    }: { 
      campaignId: string
      contactId: string
      churchId: string
      role?: 'primary' | 'secondary' | 'leader' | 'admin'
    }) => {
      const { data, error } = await supabase
        .from('campaign_contacts')
        .insert({
          campaign_id: campaignId,
          contact_id: contactId,
          church_id: churchId,
          role
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['available-contacts', variables.campaignId] })
      toast({
        title: "Success",
        description: "Contact added to campaign successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact to campaign",
        variant: "destructive",
      })
    },
  })
}

export const useUpdateCampaignContact = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<Pick<CampaignContact, 'role' | 'engagement_score' | 'notes'>>
    }) => {
      const { data, error } = await supabase
        .from('campaign_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', data.campaign_id] })
      toast({
        title: "Success",
        description: "Contact updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      })
    },
  })
}

export const useRemoveCampaignContact = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string, campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['available-contacts', variables.campaignId] })
      toast({
        title: "Success",
        description: "Contact removed from campaign successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove contact from campaign",
        variant: "destructive",
      })
    },
  })
}