import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityLogging } from './useSecurityLogging';

interface SecurityAuditEvent {
  action: 'data_export' | 'bulk_operation' | 'admin_access' | 'sensitive_data_access' | 'configuration_change';
  resource: string;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityAuditing = () => {
  const { logSecurityEvent } = useSecurityLogging();

  // Log high-risk operations for audit trail
  const logAuditEvent = useMutation({
    mutationFn: async (event: SecurityAuditEvent) => {
      // Log to security logger with audit trail
      await logSecurityEvent({
        event_type: 'admin_action',
        severity: event.risk_level === 'critical' ? 'critical' : 
                  event.risk_level === 'high' ? 'high' : 'medium',
        details: {
          audit_action: event.action,
          resource: event.resource,
          timestamp: new Date().toISOString(),
          session_info: {
            user_agent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
          },
          ...event.details
        }
      });

      // For critical events, also log to a separate audit table if it exists
      if (event.risk_level === 'critical') {
        try {
          // This would be logged to an audit table if it exists
          console.warn('CRITICAL AUDIT EVENT:', {
            action: event.action,
            resource: event.resource,
            timestamp: new Date().toISOString(),
            details: event.details
          });
        } catch (error) {
          console.error('Failed to log critical audit event:', error);
        }
      }
    },
  });

  // Helper functions for common audit events
  const logDataAccess = (resource: string, operation: 'read' | 'write' | 'delete', recordCount?: number) => {
    logAuditEvent.mutate({
      action: 'sensitive_data_access',
      resource,
      details: {
        operation,
        record_count: recordCount,
        access_time: new Date().toISOString()
      },
      risk_level: operation === 'delete' ? 'high' : 
                  operation === 'write' ? 'medium' : 'low'
    });
  };

  const logBulkOperation = (resource: string, operation: string, affectedCount: number) => {
    logAuditEvent.mutate({
      action: 'bulk_operation',
      resource,
      details: {
        operation,
        affected_records: affectedCount,
        bulk_threshold_exceeded: affectedCount > 100
      },
      risk_level: affectedCount > 100 ? 'high' : 'medium'
    });
  };

  const logDataExport = (resource: string, format: string, recordCount: number) => {
    logAuditEvent.mutate({
      action: 'data_export',
      resource,
      details: {
        export_format: format,
        record_count: recordCount,
        export_size: 'large'
      },
      risk_level: recordCount > 1000 ? 'critical' : 
                  recordCount > 100 ? 'high' : 'medium'
    });
  };

  const logConfigurationChange = (setting: string, oldValue: any, newValue: any) => {
    logAuditEvent.mutate({
      action: 'configuration_change',
      resource: `system_configuration.${setting}`,
      details: {
        setting_name: setting,
        old_value: oldValue,
        new_value: newValue,
        change_type: 'configuration_update'
      },
      risk_level: 'high' // Configuration changes are always high risk
    });
  };

  const logAdminAccess = (resource: string, action: string) => {
    logAuditEvent.mutate({
      action: 'admin_access',
      resource,
      details: {
        admin_action: action,
        privilege_escalation: true
      },
      risk_level: 'high'
    });
  };

  return {
    logAuditEvent: logAuditEvent.mutate,
    logDataAccess,
    logBulkOperation,
    logDataExport,
    logConfigurationChange,
    logAdminAccess,
    isLogging: logAuditEvent.isPending,
  };
};