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
  credentialType: string;
  phoneNumberType: string;
  accountType?: string;
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
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [quickFix, setQuickFix] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    // Enhanced phone number validation
    const cleanedPhone = phoneNumber.trim();
    const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setError('Please enter a valid phone number (e.g., +1234567890 or 1234567890)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConfigCheck(null);
    setTestResults(null);
    setDiagnostics(null);
    setErrorCode(null);
    setSolutions([]);
    setQuickFix(null);

    try {
      const { data, error } = await supabase.functions.invoke('sms-config-test', {
        body: { phoneNumber: cleanedPhone },
      });

      if (error) {
        console.error('SMS config test error:', error);
        let errorMessage = 'Failed to test SMS configuration';
        
        if (error.message?.includes('Twilio credentials missing')) {
          errorMessage = 'Twilio credentials are not configured. Please check your Twilio Account SID and Auth Token in Settings → Messaging.';
        } else if (error.message?.includes('Twilio sender configuration missing')) {
          errorMessage = 'Twilio phone number or messaging service is not configured. Please add TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID in Settings → Messaging.';
        } else if (error.message?.includes('Authentication failed')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message?.includes('Invalid phone number')) {
          errorMessage = 'Please enter a valid phone number format (e.g., +33612345678)';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        toast({
          title: 'SMS Test Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      if (data.success) {
        setConfigCheck(data.configCheck);
        setTestResults(data.testResults);
        setDiagnostics(data.diagnostics);
        toast({
          title: 'SMS Test Successful',
          description: `Test message sent successfully! Message ID: ${data.testResults?.messageId}`,
        });
      } else {
        setConfigCheck(data.configCheck);
        setDiagnostics(data.diagnostics);
        setErrorCode(data.errorCode);
        setSolutions(data.solutions || []);
        setQuickFix(data.quickFix);
        
        const errorMsg = data.error || 'Unknown error occurred';
        setError(errorMsg);
        toast({
          title: 'SMS Test Failed',
          description: data.quickFix || errorMsg,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      const errorMessage = err.message || 'An unexpected error occurred while testing SMS';
      setError(errorMessage);
      toast({
        title: 'Test Failed',
        description: errorMessage,
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
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              {errorCode && <p className="text-xs opacity-75">Error Code: {errorCode}</p>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Solutions Section */}
      {solutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Troubleshooting Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            {quickFix && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/10 rounded border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Quick Fix:</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">{quickFix}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Try these solutions:</p>
              <ul className="text-sm space-y-1 ml-4">
                {solutions.map((solution, index) => (
                  <li key={index} className="list-disc text-muted-foreground">
                    {solution}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
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
                {diagnostics.credentialType}
              </Badge>
            </div>
            
            {diagnostics.accountType && (
              <div className="flex items-center justify-between">
                <span>Account Type</span>
                <Badge variant={diagnostics.accountType === 'trial' ? "secondary" : "default"}>
                  {diagnostics.accountType}
                </Badge>
              </div>
            )}
            
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