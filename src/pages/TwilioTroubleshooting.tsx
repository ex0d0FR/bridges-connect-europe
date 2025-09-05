import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SMSConfigTest } from '@/components/SMSConfigTest';
import { WhatsAppConfigTest } from '@/components/WhatsAppConfigTest';
import { TwilioConfigurationGuide } from '@/components/TwilioConfigurationGuide';
import { WhatsAppSetupGuide } from '@/components/WhatsAppSetupGuide';
import { Settings, Phone, MessageCircle, AlertTriangle } from 'lucide-react';

export default function TwilioTroubleshooting() {
  const [smsErrors] = useState<string[]>([]);
  const [whatsAppErrors] = useState<string[]>([]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Twilio Configuration & Troubleshooting</h1>
        <p className="text-muted-foreground">
          Complete setup guide and diagnostic tools for SMS and WhatsApp messaging
        </p>
      </div>

      <Tabs defaultValue="whatsapp-setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="whatsapp-setup" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Setup
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General Guide
          </TabsTrigger>
          <TabsTrigger value="sms-test" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            SMS Test
          </TabsTrigger>
          <TabsTrigger value="whatsapp-test" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Test
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Common Issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp-setup">
          <WhatsAppSetupGuide 
            currentPhoneNumber="+19287676457"
            errorCode="63007"
            hasLiveCredentials={true}
          />
        </TabsContent>

        <TabsContent value="guide">
          <TwilioConfigurationGuide 
            currentPhoneNumber="+19287676457"
            hasLiveCredentials={true}
            smsErrors={smsErrors}
            whatsAppErrors={whatsAppErrors}
          />
        </TabsContent>

        <TabsContent value="sms-test">
          <SMSConfigTest />
        </TabsContent>

        <TabsContent value="whatsapp-test">
          <WhatsAppConfigTest />
        </TabsContent>

        <TabsContent value="troubleshooting">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Error Codes & Solutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* SMS Errors */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">SMS Error Codes</h3>
                  <div className="grid gap-3">
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 21659</code>
                        <span className="text-sm text-muted-foreground">Most Common</span>
                      </div>
                      <p className="font-medium">Phone number is not a Twilio number</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        You're using a sandbox number (+15557932346) with live credentials
                      </p>
                      <div className="text-sm">
                        <strong>Solutions:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Purchase a real phone number from Twilio Console</li>
                          <li>Switch to test credentials for sandbox testing</li>
                          <li>Use Messaging Service SID instead of phone number</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 border rounded">
                      <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 21614</code>
                      <p className="font-medium mt-2">Destination is not a mobile number</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        SMS can only be sent to mobile phone numbers
                      </p>
                      <div className="text-sm">
                        <strong>Solution:</strong> Use a mobile phone number (not landline)
                      </div>
                    </div>

                    <div className="p-3 border rounded">
                      <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 21408</code>
                      <p className="font-medium mt-2">Permission denied</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your Twilio account doesn't have SMS permissions for this number
                      </p>
                      <div className="text-sm">
                        <strong>Solution:</strong> Enable SMS capabilities in Twilio Console
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Errors */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">WhatsApp Error Codes</h3>
                  <div className="grid gap-3">
                    <div className="p-3 border rounded border-red-200 bg-red-50 dark:bg-red-900/10">
                      <div className="flex justify-between items-center mb-2">
                        <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 63007</code>
                        <span className="text-sm text-red-600 font-medium">MOST COMMON</span>
                      </div>
                      <p className="font-medium text-red-800 dark:text-red-200">WhatsApp sender number not configured</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                        Your phone number (+19287676457) is not set up as a WhatsApp Business sender in Twilio
                      </p>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        <strong>Solutions (choose one):</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li><strong>For Testing:</strong> Use WhatsApp Sandbox (+14155238886)</li>
                          <li><strong>For Production:</strong> Enable WhatsApp Business API for your number</li>
                          <li><strong>Quick Fix:</strong> Purchase a Twilio number with WhatsApp capability</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 border rounded">
                      <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 21212</code>
                      <p className="font-medium mt-2">Invalid WhatsApp sender number</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Phone number is not configured for WhatsApp Business API
                      </p>
                      <div className="text-sm">
                        <strong>Solutions:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Use WhatsApp sandbox (+14155238886) for testing</li>
                          <li>Complete WhatsApp Business API verification</li>
                          <li>Enable WhatsApp capability for your Twilio number</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 border rounded">
                      <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 21408</code>
                      <p className="font-medium mt-2">WhatsApp capability not enabled</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Phone number exists but WhatsApp is not enabled for this number
                      </p>
                      <div className="text-sm">
                        <strong>Solution:</strong> Enable WhatsApp capability in Twilio Console → Phone Numbers
                      </div>
                    </div>

                    <div className="p-3 border rounded">
                      <code className="text-sm bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Error 21620</code>
                      <p className="font-medium mt-2">WhatsApp template rejected</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Template messages must be pre-approved by WhatsApp
                      </p>
                      <div className="text-sm">
                        <strong>Solution:</strong> Submit template for approval in WhatsApp Business Manager
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credential Issues */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Credential Configuration Issues</h3>
                  <div className="grid gap-3">
                    <div className="p-3 border rounded">
                      <p className="font-medium">Sandbox vs Live Credentials</p>
                      <div className="text-sm mt-2 space-y-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                          <strong>Test Credentials (Free):</strong>
                          <ul className="list-disc list-inside mt-1">
                            <li>Account SID starts with "AC" (test account)</li>
                            <li>Use with sandbox numbers (+15557932346, +14155238886)</li>
                            <li>Limited functionality but good for testing</li>
                          </ul>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                          <strong>Live Credentials (Paid):</strong>
                          <ul className="list-disc list-inside mt-1">
                            <li>Account SID starts with "AC" (live account)</li>
                            <li>Requires purchased phone numbers</li>
                            <li>Full functionality with proper phone numbers</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}