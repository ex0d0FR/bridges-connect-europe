import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, Shield, AlertTriangle } from 'lucide-react';

interface ActivityLog {
  id: string;
  metric_name: string;
  dimensions: any;
  recorded_at: string;
}

export const UserActivityDisplay = () => {
  const { user, isApproved } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isApproved) return;

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('analytics_metrics')
          .select('*')
          .eq('metric_name', 'user_access_log')
          .contains('dimensions', { user_id: user.id })
          .order('recorded_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Set up real-time subscription for new activities
    const subscription = supabase
      .channel('user-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_metrics',
          filter: `metric_name=eq.user_access_log`,
        },
        (payload) => {
          const newActivity = payload.new as ActivityLog;
          if (newActivity.dimensions && newActivity.dimensions.user_id === user.id) {
            setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isApproved]);

  if (!user || !isApproved) return null;

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'page_view':
        return <Activity className="h-4 w-4" />;
      case 'session_invalidated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'page_view':
        return 'default';
      case 'session_invalidated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Your recent security and access events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity to display
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.dimensions?.action)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {activity.dimensions?.resource || 'Unknown'}
                        </span>
                        <Badge variant={getActivityColor(activity.dimensions?.action) as any}>
                          {activity.dimensions?.action || 'unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.recorded_at).toLocaleString()}
                      </div>
                      {activity.dimensions?.approved === false && (
                        <div className="mt-1">
                          <Badge variant="destructive" className="text-xs">
                            Access Denied
                          </Badge>
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
  );
};