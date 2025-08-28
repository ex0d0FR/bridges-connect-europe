import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, MessageSquare, Phone } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConfigCheck {
  twilioCredentials: boolean;
  twilioSender: boolean;
  messagingServiceConfigured: boolean;
  phoneNumberConfigured: boolean;
}

interface Diagnostics {
  phoneNumber: string;
  isSandboxNumber: boolean;
  hasLiveCredentials: boolean;
  recommendedAction: string;
}

interface TestResults {
  messageId: string;
  status: string;
  recipient: string;
  sender: string;
}

export function SMSConfigTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [configCheck, setConfigCheck] = useState<ConfigCheck | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a phone number to test SMS functionality.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setConfigCheck(null);
    setTestResults(null);
    setDiagnostics(null);

    try {
      const { data, error } = await supabase.functions.invoke('sms-config-test', {
        body: { phoneNumber },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setConfigCheck(data.configCheck);
        setTestResults(data.testResults);
        setDiagnostics(data.diagnostics);
        toast({
          title: 'SMS Test Successful',
          description: 'Test message sent successfully! Check your phone.',
        });
      } else {
        setConfigCheck(data.configCheck);
        setDiagnostics(data.diagnostics);
        setError(data.error);
        toast({
          title: 'SMS Test Failed',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: 'Test Failed',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Configuration Test
          </CardTitle>
          <CardDescription>
            Test your SMS configuration by sending a test message via Twilio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-phone">Test Phone Number</Label>
            <Input
              id="test-phone"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleTest} 
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full"
          >
            <Phone className="mr-2 h-4 w-4" />
            {isLoading ? 'Sending Test SMS...' : 'Send Test SMS'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {configCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Twilio Credentials</span>
              <Badge variant={configCheck.twilioCredentials ? 'default' : 'destructive'}>
                {configCheck.twilioCredentials ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <AlertCircle className="mr-1 h-3 w-3" />
                )}
                {configCheck.twilioCredentials ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Sender Configuration</span>
              <Badge variant={configCheck.twilioSender ? 'default' : 'destructive'}>
                {configCheck.twilioSender ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <AlertCircle className="mr-1 h-3 w-3" />
                )}
                {configCheck.twilioSender ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Messaging Service</span>
              <Badge variant={configCheck.messagingServiceConfigured ? 'default' : 'secondary'}>
                {configCheck.messagingServiceConfigured ? 'Enabled' : 'Not Used'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Phone Number</span>
              <Badge variant={configCheck.phoneNumberConfigured ? 'default' : 'secondary'}>
                {configCheck.phoneNumberConfigured ? 'Configured' : 'Not Used'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics Section */}
      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Phone Number Type</span>
              <Badge variant={diagnostics.isSandboxNumber ? "secondary" : "default"}>
                {diagnostics.isSandboxNumber ? "Sandbox" : "Production"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Credentials Type</span>
              <Badge variant={diagnostics.hasLiveCredentials ? "default" : "secondary"}>
                {diagnostics.hasLiveCredentials ? "Live" : "Test"}
              </Badge>
            </div>
            
            {diagnostics.recommendedAction && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Recommended Action:</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{diagnostics.recommendedAction}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Test Successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Message ID</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">{testResults.messageId}</code>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge>{testResults.status}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Recipient</span>
              <span className="text-sm">{testResults.recipient}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Sender</span>
              <span className="text-sm">{testResults.sender}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}