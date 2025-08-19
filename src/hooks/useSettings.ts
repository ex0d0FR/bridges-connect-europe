import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Settings {
  id?: string;
  organization_name?: string;
  primary_contact_email?: string;
  conference_date?: string;
  sender_name?: string;
  sender_email?: string;
  whatsapp_phone_number?: string;
  twilio_account_name?: string;
  twilio_phone_number?: string;
  twilio_friendly_name?: string;
  whatsapp_business_name?: string;
  whatsapp_phone_numbers?: string[];
}

export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const saveSettings = useMutation({
    mutationFn: async (settingsData: Settings) => {
      if (!user?.id) throw new Error('User not authenticated');

      const dataToSave = {
        ...settingsData,
        user_id: user.id,
      };

      // Try to update first, then insert if no record exists
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        const { data, error } = await supabase
          .from('settings')
          .update(dataToSave)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    },
  });

  return {
    settings,
    isLoading,
    saveSettings: saveSettings.mutate,
    isSaving: saveSettings.isPending,
  };
}