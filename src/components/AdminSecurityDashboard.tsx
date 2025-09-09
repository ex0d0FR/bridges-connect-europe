import { useEffect, useState } from 'react';
import { useIsAdmin } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  Lock,
  Eye,
  TrendingUp,
  Clock
} from 'lucide-react';

interface SecurityMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  dimensions: any;
  recorded_at: string;
}

interface SecuritySummary {
  totalUsers: number;
  pendingApprovals: number;
  suspiciousActivities: number;
  recentLogins: number;
}

export const AdminSecurityDashboard = () => {
  const isAdmin = useIsAdmin();
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [summary, setSummary] = useState<SecuritySummary>({
    totalUsers: 0,
    pendingApprovals: 0,
    suspiciousActivities: 0,
    recentLogins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSecurityData = async () => {
      try {
        // Fetch security metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('analytics_metrics')
          .select('*')
          .in('metric_name', ['user_access_log', 'security_event'])
          .order('recorded_at', { ascending: false })
          .limit(50);

        if (metricsError) throw metricsError;
        setMetrics(metricsData || []);

        // Fetch user summary
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('status');

        if (profilesError) throw profilesError;

        const pending = profiles?.filter(p => p.status === 'pending').length || 0;
        const total = profiles?.length || 0;

        // Count recent logins and suspicious activities
        const recentLogins = metricsData?.filter(m => 
          m.metric_name === 'user_access_log' && 
          typeof m.dimensions === 'object' &&
          m.dimensions &&
          (m.dimensions as any).action === 'page_view' &&
          new Date(m.recorded_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0;

        const suspicious = metricsData?.filter(m => 
          m.metric_name === 'security_event' &&
          typeof m.dimensions === 'object' &&
          m.dimensions &&
          (m.dimensions as any).event_type === 'suspicious_activity'
        ).length || 0;

        setSummary({
          totalUsers: total,
          pendingApprovals: pending,
          suspiciousActivities: suspicious,
          recentLogins,
        });
      } catch (error) {
        console.error('Error fetching security data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('admin-security')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_metrics',
        },
        () => {
          fetchSecurityData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view the security dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'auth_attempt':
        return <Lock className="h-4 w-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4" />;
      case 'data_access':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getDimensionValue = (dimensions: any, key: string) => {
    if (typeof dimensions === 'object' && dimensions) {
      return dimensions[key];
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recentLogins}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.suspiciousActivities}</div>
            <p className="text-xs text-muted-foreground">
              Suspicious activities
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>
                Latest user access and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {metrics
                      .filter(m => m.metric_name === 'user_access_log')
                      .map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-start justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-3">
                            <Activity className="h-4 w-4 mt-1" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {getDimensionValue(metric.dimensions, 'resource') || 'Unknown'}
                                </span>
                                <Badge variant="default">
                                  {getDimensionValue(metric.dimensions, 'action') || 'unknown'}
                                </Badge>
                                {getDimensionValue(metric.dimensions, 'approved') === false && (
                                  <Badge variant="destructive">Denied</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                User: {getDimensionValue(metric.dimensions, 'user_id') || 'Unknown'} | 
                                {new Date(metric.recorded_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Authentication attempts, suspicious activities, and security alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {metrics
                      .filter(m => m.metric_name === 'security_event')
                      .map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-start justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-3">
                            {getEventIcon(getDimensionValue(metric.dimensions, 'event_type'))}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {getDimensionValue(metric.dimensions, 'event_type') || 'Unknown Event'}
                                </span>
                                <Badge variant={getSeverityColor(getDimensionValue(metric.dimensions, 'severity')) as any}>
                                  {getDimensionValue(metric.dimensions, 'severity') || 'unknown'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {new Date(metric.recorded_at).toLocaleString()}
                              </div>
                              {getDimensionValue(metric.dimensions, 'details') && (
                                <div className="text-xs text-muted-foreground">
                                  {JSON.stringify(getDimensionValue(metric.dimensions, 'details'), null, 2).substring(0, 100)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};