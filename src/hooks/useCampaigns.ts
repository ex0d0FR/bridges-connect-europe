import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecurityAuditing } from '@/hooks/useSecurityAuditing';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  created_by: string;
}

export interface CampaignWithStats extends Campaign {
  church_count?: number;
  message_count?: number;
  sent_count?: number;
  failed_count?: number;
}

export const useCampaigns = () => {
  const { logDataAccess } = useSecurityAuditing();

  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Log data access for audit trail
      logDataAccess('campaigns', 'read');

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_churches (count),
          messages (count)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as CampaignWithStats[];
    },
  });
};

export const useCampaignStats = () => {
  return useQuery({
    queryKey: ['campaign-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('status')
        .eq('created_by', user.id);

      if (error) throw error;

      const stats = {
        active: campaigns.filter(c => c.status === 'active').length,
        draft: campaigns.filter(c => c.status === 'draft').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        paused: campaigns.filter(c => c.status === 'paused').length,
        total: campaigns.length
      };

      return stats;
    },
  });
};

export const useCampaignChurches = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-churches', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_churches')
        .select(`
          church_id,
          churches (
            id,
            name,
            email,
            phone,
            contact_name,
            city,
            country
          )
        `)
        .eq('campaign_id', campaignId);

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
};

export const useLaunchCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      console.log('Launching campaign:', campaignId);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user ? { id: user.id, email: user.email } : 'not authenticated');
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('campaign-management', {
        body: {
          action: 'start',
          campaignId: campaignId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Campaign launch response:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      toast({
        title: "Success",
        description: "Campaign launched successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to launch campaign",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('created_by', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCampaignStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ campaignId, status }: { campaignId: string; status: Campaign['status'] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('created_by', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      toast({
        title: "Success",
        description: "Campaign status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign status",
        variant: "destructive",
      });
    },
  });
};