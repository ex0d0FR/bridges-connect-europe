import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityLogging } from '@/hooks/useSecurityLogging';
import { supabase } from '@/integrations/supabase/client';

interface ActivityOptions {
  trackPageViews?: boolean;
  trackUserActions?: boolean;
  inactivityTimeoutMinutes?: number;
}

export const useUserActivityMonitor = (options: ActivityOptions = {}) => {
  const { user, isApproved } = useAuth();
  const { logSecurityEvent, logDataAccess } = useSecurityLogging();

  const {
    trackPageViews = true,
    trackUserActions = true,
    inactivityTimeoutMinutes = 60,
  } = options;

  // Track page access
  const logPageAccess = useCallback(async (resource: string) => {
    if (!user || !isApproved) return;

    try {
      // Log database access using our new function
      await supabase.rpc('log_user_access', {
        _user_id: user.id,
        _resource: resource,
        _action: 'page_view'
      });

      logDataAccess(resource, 'read', true);
    } catch (error) {
      console.error('Error logging page access:', error);
      logDataAccess(resource, 'read', false);
    }
  }, [user, isApproved, logDataAccess]);

  // Track user actions
  const logUserAction = useCallback(async (action: string, resource: string, details?: any) => {
    if (!user || !isApproved) return;

    try {
      await supabase.rpc('log_user_access', {
        _user_id: user.id,
        _resource: resource,
        _action: action
      });

      logSecurityEvent({
        event_type: 'data_access',
        severity: 'low',
        details: {
          audit_action: 'user_action',
          resource,
          action,
          ...details,
          timestamp: new Date().toISOString(),
          session_info: {
            user_agent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
          }
        }
      });
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }, [user, isApproved, logSecurityEvent]);

  // Monitor for suspicious activity patterns
  useEffect(() => {
    if (!user || !isApproved || !trackUserActions) return;

    let activityTimer: NodeJS.Timeout;
    let inactivityTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      lastActivity = Date.now();
      
      inactivityTimer = setTimeout(() => {
        logSecurityEvent({
          event_type: 'suspicious_activity',
          severity: 'medium',
          details: {
            activity: 'prolonged_inactivity',
            duration_minutes: inactivityTimeoutMinutes,
            last_activity: new Date(lastActivity).toISOString(),
          }
        });
      }, inactivityTimeoutMinutes * 60 * 1000);
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(activityTimer);
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, isApproved, trackUserActions, inactivityTimeoutMinutes, logSecurityEvent]);

  return {
    logPageAccess,
    logUserAction,
  };
};