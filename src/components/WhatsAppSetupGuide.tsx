import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { 
  MessageCircle, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Phone,
  Settings,
  CreditCard,
  Zap
} from 'lucide-react';

interface WhatsAppSetupGuideProps {
  currentPhoneNumber?: string;
  errorCode?: string;
  hasLiveCredentials?: boolean;
}

export function WhatsAppSetupGuide({ 
  currentPhoneNumber, 
  errorCode,
  hasLiveCredentials 
}: WhatsAppSetupGuideProps) {
  const isSandboxNumber = currentPhoneNumber?.includes('14155238886');
  const hasError63007 = errorCode === '63007';

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp Business API Setup
          </CardTitle>
          <CardDescription>
            Complete guide to configure WhatsApp messaging with Twilio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {hasError63007 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error 63007 Detected:</strong> Your phone number ({currentPhoneNumber}) is not configured as a WhatsApp Business sender in Twilio. WhatsApp requires additional setup beyond regular SMS.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Current Phone Number</p>
                <p className="text-sm text-muted-foreground">
                  {currentPhoneNumber || 'Not configured'}
                </p>
              </div>
              <Badge variant={isSandboxNumber ? "secondary" : hasError63007 ? "destructive" : "default"}>
                {isSandboxNumber ? "Sandbox" : hasError63007 ? "Not WhatsApp Enabled" : "Set"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solution Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Fix WhatsApp Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Option 1: Quick Testing Solution */}
          <div className="p-4 border rounded bg-green-50 dark:bg-green-900/10">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Option 1: Use WhatsApp Sandbox (Quick Test)
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Perfect for testing WhatsApp functionality without business verification
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>Sandbox Number: <code>+14155238886</code></span>
              </div>
              <div className="text-green-600 dark:text-green-400">
                <strong>Steps:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 ml-4">
                  <li>Update your phone number setting to +14155238886</li>
                  <li>Join the sandbox by sending "join [sandbox-word]" to the number</li>
                  <li>Test WhatsApp messaging immediately</li>
                </ol>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.open('https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open WhatsApp Sandbox
            </Button>
          </div>

          {/* Option 2: Production Solution */}
          <div className="p-4 border rounded bg-blue-50 dark:bg-blue-900/10">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Option 2: Enable WhatsApp for Your Number (Production)
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Use your current number ({currentPhoneNumber}) for WhatsApp Business
            </p>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1 ml-4">
                <li>Go to Twilio Console → Phone Numbers → Manage → Active Numbers</li>
                <li>Click on your number ({currentPhoneNumber})</li>
                <li>In "Messaging" section, check "WhatsApp" capability</li>
                <li>Complete WhatsApp Business verification if prompted</li>
                <li>Wait for approval (can take 1-5 business days)</li>
              </ol>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://console.twilio.com/us1/develop/phone-numbers/manage/active', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Manage Phone Numbers
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://business.whatsapp.com/', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                WhatsApp Business
              </Button>
            </div>
          </div>

          {/* Option 3: Buy New Number */}
          <div className="p-4 border rounded bg-purple-50 dark:bg-purple-900/10">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Option 3: Purchase WhatsApp-Enabled Number
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              Buy a new Twilio number that comes with WhatsApp capability pre-enabled
            </p>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              <strong>Benefits:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                <li>Instant WhatsApp capability</li>
                <li>No verification delays</li>
                <li>Dedicated business number</li>
              </ul>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.open('https://console.twilio.com/us1/develop/phone-numbers/manage/search?capabilities%5B%5D=sms&capabilities%5B%5D=whatsapp', '_blank')}
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Buy WhatsApp Number
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirements & Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>WhatsApp Business API Requirements:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• WhatsApp Business Account verification</li>
                <li>• Meta Business Manager account</li>
                <li>• Phone number ownership verification</li>
                <li>• Business profile completion</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-2">Sandbox Limitations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Only works with verified test numbers</li>
                <li>• Limited to 5 phone numbers</li>
                <li>• 24-hour conversation window</li>
                <li>• Template restrictions</li>
              </ul>
            </div>
            
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-2">Production Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Message any WhatsApp user</li>
                <li>• Custom templates</li>
                <li>• Business verification badge</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}