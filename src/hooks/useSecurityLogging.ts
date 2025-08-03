import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: 'role_change' | 'campaign_launch' | 'config_update' | 'auth_attempt';
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityLogging = () => {
  const logSecurityEvent = useMutation({
    mutationFn: async (event: SecurityEvent) => {
      // Log to console for development
      console.log('Security Event:', {
        timestamp: new Date().toISOString(),
        ...event,
      });

      // In a production environment, you would send this to a dedicated security logging service
      // For now, we'll use Supabase's built-in logging via edge functions
      const { error } = await supabase.functions.invoke('security-logger', {
        body: {
          timestamp: new Date().toISOString(),
          ...event,
        },
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    },
  });

  return {
    logSecurityEvent: logSecurityEvent.mutate,
    isLogging: logSecurityEvent.isPending,
  };
};