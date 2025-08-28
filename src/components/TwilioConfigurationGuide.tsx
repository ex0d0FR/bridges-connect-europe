import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Phone, 
  MessageCircle,
  ExternalLink,
  Key,
  CreditCard,
  Globe
} from 'lucide-react';

interface TwilioGuideProps {
  currentPhoneNumber?: string;
  hasLiveCredentials?: boolean;
  smsErrors?: string[];
  whatsAppErrors?: string[];
}

export function TwilioConfigurationGuide({ 
  currentPhoneNumber, 
  hasLiveCredentials,
  smsErrors = [],
  whatsAppErrors = []
}: TwilioGuideProps) {
  const isSandboxNumber = currentPhoneNumber?.includes('15557932346') || 
                          currentPhoneNumber?.includes('14155238886');
  
  const hasErrors = smsErrors.length > 0 || whatsAppErrors.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Twilio Configuration Guide
        </CardTitle>
        <CardDescription>
          Complete setup guide for SMS and WhatsApp messaging with Twilio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Status Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration Issue Detected:</strong>
              {isSandboxNumber && hasLiveCredentials && (
                <span className="block mt-1">
                  You're using live Twilio credentials with a sandbox phone number ({currentPhoneNumber}). 
                  Live credentials require purchased phone numbers.
                </span>
              )}
              {!hasLiveCredentials && (
                <span className="block mt-1">
                  Missing Twilio credentials. Please configure your Account SID and Auth Token.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Account Setup */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Key className="h-4 w-4" />
            1. Twilio Account Setup
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Account SID</p>
                <p className="text-sm text-muted-foreground">Your Twilio account identifier</p>
              </div>
              <Badge variant={hasLiveCredentials ? "default" : "destructive"}>
                {hasLiveCredentials ? "Configured" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Auth Token</p>
                <p className="text-sm text-muted-foreground">Your Twilio authentication token</p>
              </div>
              <Badge variant={hasLiveCredentials ? "default" : "destructive"}>
                {hasLiveCredentials ? "Configured" : "Missing"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Phone Number Configuration */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            2. Phone Number Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">Current Phone Number</p>
                <p className="text-sm text-muted-foreground">
                  {currentPhoneNumber || 'Not configured'}
                </p>
                {isSandboxNumber && (
                  <Badge variant="secondary" className="mt-1">Sandbox Number</Badge>
                )}
              </div>
              <Badge variant={currentPhoneNumber ? "default" : "destructive"}>
                {currentPhoneNumber ? "Set" : "Missing"}
              </Badge>
            </div>

            {/* Phone Number Types Explanation */}
            <div className="grid gap-3">
              <div className="p-3 border rounded bg-green-50 dark:bg-green-900/10">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                  Production Phone Numbers
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Required for live credentials. Must be purchased from Twilio.
                </p>
                <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  <li>• Can send SMS to any number</li>
                  <li>• Can send WhatsApp to verified business numbers</li>
                  <li>• Works with live Account SID/Auth Token</li>
                </ul>
              </div>
              
              <div className="p-3 border rounded bg-yellow-50 dark:bg-yellow-900/10">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Sandbox Numbers
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  Free testing numbers. Only work with Twilio test credentials.
                </p>
                <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                  <li>• +15557932346 (SMS sandbox)</li>
                  <li>• +14155238886 (WhatsApp sandbox)</li>
                  <li>• Only work with test Account SID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* WhatsApp Setup */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            3. WhatsApp Business Setup
          </h3>
          
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                WhatsApp Business API requires additional setup beyond regular SMS
              </AlertDescription>
            </Alert>

            <div className="grid gap-3">
              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">For Testing (Sandbox)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use Twilio Console WhatsApp sandbox</li>
                  <li>• Phone: +14155238886</li>
                  <li>• Join sandbox: Send "join [sandbox-word]" to sandbox number</li>
                </ul>
              </div>
              
              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">For Production</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Register WhatsApp Business Account</li>
                  <li>• Get Meta Business verification</li>
                  <li>• Purchase Twilio phone number with WhatsApp capability</li>
                  <li>• Complete WhatsApp Business API approval process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Fix Solutions */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Quick Fix Solutions
          </h3>
          
          <div className="grid gap-3">
            {hasLiveCredentials && isSandboxNumber && (
              <div className="p-3 border rounded bg-blue-50 dark:bg-blue-900/10">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Option 1: Purchase Production Phone Number
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Buy a phone number from Twilio Console to use with your live credentials
                </p>
                <a 
                  href="https://console.twilio.com/us1/develop/phone-numbers/manage/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CreditCard className="h-3 w-3" />
                  Buy Phone Number in Twilio Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            <div className="p-3 border rounded bg-green-50 dark:bg-green-900/10">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Option 2: Use Test Credentials (Free)
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                Switch to Twilio test credentials to use sandbox numbers for testing
              </p>
              <a 
                href="https://console.twilio.com/us1/account/keys-credentials/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                Get Test Credentials from Twilio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {hasErrors && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600">Current Errors</h3>
              <div className="space-y-2">
                {smsErrors.map((error, index) => (
                  <div key={index} className="p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm text-red-700 dark:text-red-300">
                    <strong>SMS:</strong> {error}
                  </div>
                ))}
                {whatsAppErrors.map((error, index) => (
                  <div key={index} className="p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm text-red-700 dark:text-red-300">
                    <strong>WhatsApp:</strong> {error}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}