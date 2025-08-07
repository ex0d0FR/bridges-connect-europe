import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: 'role_change' | 'campaign_launch' | 'config_update' | 'auth_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'admin_action';
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export const useSecurityLogging = () => {
  const logSecurityEvent = useMutation({
    mutationFn: async (event: SecurityEvent) => {
      // Enhanced security event with additional context
      const enhancedEvent = {
        timestamp: new Date().toISOString(),
        session_id: crypto.randomUUID(),
        ...event,
      };

      // Log to console for development with structured format
      console.log('SECURITY_EVENT:', JSON.stringify(enhancedEvent));

      // Send to security logging service
      const { error } = await supabase.functions.invoke('security-logger', {
        body: enhancedEvent,
      });

      if (error) {
        console.error('Failed to log security event:', error);
        // Fallback: store critical events locally for retry
        if (event.severity === 'critical' || event.severity === 'high') {
          try {
            const failedEvents = JSON.parse(localStorage.getItem('failed_security_events') || '[]');
            failedEvents.push(enhancedEvent);
            localStorage.setItem('failed_security_events', JSON.stringify(failedEvents.slice(-10))); // Keep last 10
          } catch (e) {
            console.error('Failed to store security event locally:', e);
          }
        }
      }
    },
  });

  // Helper functions for common security events
  const logAuthAttempt = (success: boolean, email?: string, errorDetails?: string) => {
    logSecurityEvent.mutate({
      event_type: 'auth_attempt',
      severity: success ? 'low' : 'medium',
      details: {
        success,
        email,
        error: errorDetails,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const logAdminAction = (action: string, targetUserId?: string, details?: Record<string, any>) => {
    logSecurityEvent.mutate({
      event_type: 'admin_action',
      severity: 'medium',
      details: {
        action,
        target_user_id: targetUserId,
        ...details,
      },
    });
  };

  const logSuspiciousActivity = (activity: string, details?: Record<string, any>) => {
    logSecurityEvent.mutate({
      event_type: 'suspicious_activity',
      severity: 'high',
      details: {
        activity,
        ...details,
      },
    });
  };

  const logDataAccess = (resource: string, operation: string, success: boolean) => {
    logSecurityEvent.mutate({
      event_type: 'data_access',
      severity: success ? 'low' : 'medium',
      details: {
        resource,
        operation,
        success,
      },
    });
  };

  return {
    logSecurityEvent: logSecurityEvent.mutate,
    logAuthAttempt,
    logAdminAction,
    logSuspiciousActivity,
    logDataAccess,
    isLogging: logSecurityEvent.isPending,
  };
};