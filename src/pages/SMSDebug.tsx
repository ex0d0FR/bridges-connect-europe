import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MessageSquare, 
  Settings, 
  Send,
  RefreshCw,
  Info
} from 'lucide-react';

export default function SMSDebug() {
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from Bridges Connect');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingSMS, setIsTestingSMS] = useState(false);

  // Check Twilio configuration
  const { data: twilioConfig, isLoading: configLoading } = useQuery({
    queryKey: ['twilio-config'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sms-config-test', {
          body: { test: true }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Twilio config test error:', error);
        return { error: error.message, configured: false };
      }
    },
  });

  // Get recent campaigns and messages
  const { data: recentData, isLoading: dataLoading } = useQuery({
    queryKey: ['sms-debug-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get recent campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (campaignError) throw campaignError;

      // Get recent messages
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          campaigns(name),
          churches(name, phone)
        `)
        .eq('created_by', user.id)
        .eq('type', 'sms')
        .order('created_at', { ascending: false })
        .limit(10);

      if (messageError) throw messageError;

      // Get templates
      const { data: templates, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('created_by', user.id)
        .eq('type', 'sms')
        .order('created_at', { ascending: false });

      if (templateError) throw templateError;

      return { campaigns, messages, templates };
    },
  });

  const handleTestSMS = async () => {
    if (!testPhone || !testMessage) return;
    
    setIsTestingSMS(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: testPhone,
          content: testMessage,
          isTest: true
        }
      });

      if (error) {
        setTestResult({ success: false, error: error.message });
      } else {
        setTestResult({ success: true, data });
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsTestingSMS(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'delivered': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Debug Dashboard</h1>
          <p className="text-muted-foreground">
            Diagnose SMS sending issues and test Twilio configuration
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          SMS Diagnostics
        </Badge>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test SMS</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Twilio Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking configuration...
                </div>
              ) : (
                <div className="space-y-4">
                  {twilioConfig?.configured ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Twilio is configured!</strong>
                        <div className="mt-2 text-sm space-y-1">
                          <div>Account SID: {twilioConfig.accountSid ? '✅ Set' : '❌ Missing'}</div>
                          <div>Auth Token: {twilioConfig.authToken ? '✅ Set' : '❌ Missing'}</div>
                          <div>Phone Number: {twilioConfig.phoneNumber ? `✅ ${twilioConfig.phoneNumber}` : '❌ Missing'}</div>
                          {twilioConfig.messagingServiceSid && (
                            <div>Messaging Service: ✅ {twilioConfig.messagingServiceSid}</div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Twilio Configuration Issues:</strong>
                        <div className="mt-2">
                          {twilioConfig?.error || 'Twilio credentials are not properly configured.'}
                        </div>
                        <div className="mt-3 text-sm">
                          <strong>Required Environment Variables:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>TWILIO_ACCOUNT_SID (from Twilio Console)</li>
                            <li>TWILIO_AUTH_TOKEN (from Twilio Console)</li>
                            <li>TWILIO_PHONE_NUMBER (purchased number) OR</li>
                            <li>TWILIO_MESSAGING_SERVICE_SID (messaging service)</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>1. Get Twilio Credentials:</strong>
                <p>Visit <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twilio Console</a> and copy your Account SID and Auth Token.</p>
              </div>
              <div>
                <strong>2. Get a Phone Number:</strong>
                <p>Purchase a phone number from Twilio or set up a Messaging Service.</p>
              </div>
              <div>
                <strong>3. Add to Supabase:</strong>
                <p>Go to your Supabase project settings → Edge Functions → Environment Variables and add:</p>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>TWILIO_ACCOUNT_SID</li>
                  <li>TWILIO_AUTH_TOKEN</li>
                  <li>TWILIO_PHONE_NUMBER (or TWILIO_MESSAGING_SERVICE_SID)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Test SMS Sending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-phone">Phone Number</Label>
                  <Input
                    id="test-phone"
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
                <div>
                  <Label htmlFor="test-message">Message</Label>
                  <Textarea
                    id="test-message"
                    placeholder="Test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleTestSMS}
                disabled={!testPhone || !testMessage || isTestingSMS}
                className="w-full"
              >
                {isTestingSMS ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending Test SMS...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </>
                )}
              </Button>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {testResult.success ? (
                      <div>
                        <strong>SMS sent successfully!</strong>
                        <div className="text-xs mt-1">
                          Message ID: {testResult.data?.messageId}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <strong>SMS failed:</strong> {testResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {dataLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading recent activity...
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent SMS Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentData?.messages?.length === 0 ? (
                    <p className="text-muted-foreground">No SMS messages found</p>
                  ) : (
                    <div className="space-y-3">
                      {recentData?.messages?.map((message: any) => (
                        <div key={message.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(message.status)}>
                                {message.status}
                              </Badge>
                              <span className="text-sm font-medium">
                                {message.churches?.name || 'Unknown Church'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>To: {message.recipient_phone || 'No phone'}</div>
                            <div>Campaign: {message.campaigns?.name || 'Unknown'}</div>
                            {message.failed_reason && (
                              <div className="text-red-600">Error: {message.failed_reason}</div>
                            )}
                            <div className="text-muted-foreground">
                              Content: {message.content?.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentData?.campaigns?.length === 0 ? (
                    <p className="text-muted-foreground">No campaigns found</p>
                  ) : (
                    <div className="space-y-3">
                      {recentData?.campaigns?.map((campaign: any) => (
                        <div key={campaign.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {campaign.description}
                              </div>
                            </div>
                            <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : recentData?.templates?.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No SMS templates found</p>
                  <Button asChild>
                    <a href="/templates">Create SMS Template</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentData?.templates?.map((template: any) => (
                    <div key={template.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{template.name}</div>
                        <Badge variant="outline">SMS</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {template.content?.substring(0, 200)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}