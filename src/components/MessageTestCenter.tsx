import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, Mail, MessageSquare, MessageCircle, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  type: 'email' | 'sms' | 'whatsapp'
  success: boolean
  message: string
  timestamp: Date
}

export function MessageTestCenter() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<TestResult[]>([])
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: 'Test Email from Missionary Bridges',
    content: 'This is a test message to verify email functionality.'
  })
  
  const [smsForm, setSmsForm] = useState({
    to: '',
    content: 'Test SMS from Missionary Bridges. Please ignore this message.'
  })
  
  const [whatsappForm, setWhatsappForm] = useState({
    to: '',
    content: 'Test WhatsApp message from Missionary Bridges. Please ignore this message.'
  })

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 4)]) // Keep only last 5 results
  }

  const testEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all email fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(prev => ({ ...prev, email: true }))
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailForm.to,
          subject: emailForm.subject,
          content: emailForm.content,
          churchId: '00000000-0000-0000-0000-000000000000'
        }
      })

      if (error) throw error

      addTestResult({
        type: 'email',
        success: true,
        message: `Email sent successfully to ${emailForm.to}`,
        timestamp: new Date()
      })

      toast({
        title: "Email Test Successful",
        description: `Test email sent to ${emailForm.to}`,
      })
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred'
      
      addTestResult({
        type: 'email',
        success: false,
        message: `Email failed: ${errorMessage}`,
        timestamp: new Date()
      })

      toast({
        title: "Email Test Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }))
    }
  }

  const testSMS = async () => {
    if (!smsForm.to || !smsForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all SMS fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(prev => ({ ...prev, sms: true }))
    
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: smsForm.to,
          content: smsForm.content,
          churchId: '00000000-0000-0000-0000-000000000000',
          isTest: true
        }
      })

      if (error) {
        console.error('SMS send error:', error);
        let errorMessage = 'Failed to send SMS';
        
        if (error.message?.includes('Twilio credentials missing')) {
          errorMessage = 'SMS not configured: Twilio credentials are missing. Please check Settings → Messaging tab.';
        } else if (error.message?.includes('Twilio sender configuration missing')) {
          errorMessage = 'SMS not configured: Twilio phone number is missing. Please check Settings → Messaging tab.';
        } else if (error.message?.includes('Invalid phone number')) {
          errorMessage = 'Please enter a valid phone number (e.g., +33612345678)';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (data?.success) {
        addTestResult({
          type: 'sms',
          success: true,
          message: `SMS sent successfully to ${smsForm.to}. Message ID: ${data.messageId}`,
          timestamp: new Date()
        })

        toast({
          title: "SMS Test Successful",
          description: `Test SMS sent to ${smsForm.to}`,
        })
        
        // Clear form on success
        setSmsForm(prev => ({ ...prev, to: '', content: 'Test SMS from Missionary Bridges. Please ignore this message.' }))
      } else {
        throw new Error('SMS sending failed - please check your configuration');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred'
      
      addTestResult({
        type: 'sms',
        success: false,
        message: `SMS failed: ${errorMessage}`,
        timestamp: new Date()
      })

      toast({
        title: "SMS Test Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(prev => ({ ...prev, sms: false }))
    }
  }

  const testWhatsApp = async () => {
    if (!whatsappForm.to || !whatsappForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all WhatsApp fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(prev => ({ ...prev, whatsapp: true }))
    
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          recipient_phone: whatsappForm.to,
          message_body: whatsappForm.content,
          message_type: 'text'
        }
      })

      if (error) {
        console.error('WhatsApp send error:', error);
        let errorMessage = 'WhatsApp Business API is not fully configured yet';
        
        if (error.message?.includes('WhatsApp') || error.message?.includes('WHATSAPP')) {
          errorMessage = 'WhatsApp messaging is coming soon! For now, you can use SMS and email messaging.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (data?.success) {
        addTestResult({
          type: 'whatsapp',
          success: true,
          message: `WhatsApp sent successfully to ${whatsappForm.to}`,
          timestamp: new Date()
        })

        toast({
          title: "WhatsApp Test Successful",
          description: `Test WhatsApp sent to ${whatsappForm.to}`,
        })
        
        // Clear form on success
        setWhatsappForm(prev => ({ ...prev, to: '', content: 'Test WhatsApp message from Missionary Bridges. Please ignore this message.' }))
      } else {
        throw new Error('WhatsApp messaging is not available yet - please use SMS or email instead');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'WhatsApp messaging is coming soon! Use SMS or email for now.'
      
      addTestResult({
        type: 'whatsapp',
        success: false,
        message: `WhatsApp failed: ${errorMessage}`,
        timestamp: new Date()
      })

      toast({
        title: "WhatsApp Not Available",
        description: errorMessage,
        variant: "default"
      })
    } finally {
      setIsLoading(prev => ({ ...prev, whatsapp: false }))
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />
      default: return <Send className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Message Test Center</h2>
        <p className="text-muted-foreground">
          Test your messaging services to ensure they're working correctly
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Test
              </CardTitle>
              <CardDescription>
                Send a test email to verify your SendGrid configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email-to">Recipient Email</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="test@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email-content">Message Content</Label>
                <Textarea
                  id="email-content"
                  rows={4}
                  value={emailForm.content}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={testEmail} 
                disabled={isLoading.email}
                className="w-full"
              >
                {isLoading.email ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Test
              </CardTitle>
              <CardDescription>
                Send a test SMS to verify your Twilio configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sms-to">Recipient Phone Number</Label>
                <Input
                  id="sms-to"
                  placeholder="+33 6 12 34 56 78"
                  value={smsForm.to}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sms-content">Message Content</Label>
                <Textarea
                  id="sms-content"
                  rows={3}
                  placeholder="Keep it short for SMS (160 characters max)"
                  value={smsForm.content}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, content: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Characters: {smsForm.content.length}/160
                </p>
              </div>
              
              <Button 
                onClick={testSMS} 
                disabled={isLoading.sms}
                className="w-full"
              >
                {isLoading.sms ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending SMS...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Test
              </CardTitle>
              <CardDescription>
                Send a test WhatsApp message to verify your WhatsApp Business API configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="whatsapp-to">Recipient Phone Number</Label>
                <Input
                  id="whatsapp-to"
                  placeholder="+33 6 12 34 56 78"
                  value={whatsappForm.to}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="whatsapp-content">Message Content</Label>
                <Textarea
                  id="whatsapp-content"
                  rows={4}
                  value={whatsappForm.content}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={testWhatsApp} 
                disabled={isLoading.whatsapp}
                className="w-full"
              >
                {isLoading.whatsapp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending WhatsApp...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test WhatsApp
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>
              Latest test attempts and their outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getIcon(result.type)}
                        <Badge variant="outline" className="capitalize">
                          {result.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{result.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Help */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          If tests are failing, check your API configurations in the Settings page. 
          Make sure all required secrets are properly configured in your Supabase project settings.
        </AlertDescription>
      </Alert>
    </div>
  )
}