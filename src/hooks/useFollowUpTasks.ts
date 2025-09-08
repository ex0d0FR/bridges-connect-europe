import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface FollowUpTask {
  id: string
  campaign_id: string
  church_id?: string
  contact_id?: string
  created_by: string
  assigned_to?: string
  task_type: 'call' | 'email' | 'meeting' | 'visit' | 'follow_up_email'
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completed_at?: string
  notes?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export const useFollowUpTasks = (campaignId: string) => {
  return useQuery({
    queryKey: ['follow-up-tasks', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('follow_up_tasks')
        .select(`
          *,
          churches (name, contact_name),
          contacts (first_name, last_name, email, phone)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (FollowUpTask & { churches?: any, contacts?: any })[]
    },
    enabled: !!campaignId,
  })
}

export const useCreateFollowUpTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (task: Omit<FollowUpTask, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('follow_up_tasks')
        .insert({ ...task, created_by: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-tasks', variables.campaign_id] })
      toast({
        title: "Success",
        description: "Follow-up task created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create follow-up task",
        variant: "destructive",
      })
    },
  })
}

export const useUpdateFollowUpTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<FollowUpTask> }) => {
      const { data, error } = await supabase
        .from('follow_up_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-tasks', data.campaign_id] })
      toast({
        title: "Success",
        description: "Follow-up task updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow-up task",
        variant: "destructive",
      })
    },
  })
}

export const useDeleteFollowUpTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string, campaignId: string }) => {
      const { error } = await supabase
        .from('follow_up_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-tasks', variables.campaignId] })
      toast({
        title: "Success",
        description: "Follow-up task deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete follow-up task",
        variant: "destructive",
      })
    },
  })
}