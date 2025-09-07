import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface ConfigStatus {
  twilio: {
    configured: boolean
    status: string
    phoneNumber: string | null
    details: {
      hasAccountSid: boolean
      hasAuthToken: boolean
      hasPhoneNumber: boolean
    }
  }
  diagnostics?: {
    phoneNumber: string
    isSandboxNumber: boolean
    hasLiveCredentials: boolean
    recommendedAction: string | null
  } | null
  recommendation: string
}

export function WhatsAppConfigTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<ConfigStatus | null>(null)
  const { toast } = useToast()

  const testConfiguration = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-config-test')

      if (error) {
        throw new Error(error.message || 'Failed to test configuration')
      }

      setStatus(data)
      
      if (data.twilio.status === 'connected') {
        toast({
          title: "Configuration Test Complete",
          description: "Twilio WhatsApp configuration tested successfully",
        })
      } else {
        toast({
          title: "Configuration Issues Found",
          description: "Please check your Twilio WhatsApp settings",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error testing WhatsApp configuration:', error)
      
      let errorMessage = 'Failed to test WhatsApp configuration'
      
      if (error.message?.includes('WhatsApp credentials missing') || error.message?.includes('WHATSAPP')) {
        errorMessage = 'WhatsApp Business API is not fully configured yet. This feature is coming soon! For now, you can use SMS and email messaging.'
      } else if (error.message?.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please log in again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "WhatsApp Configuration Status",
        description: errorMessage,
        variant: error.message?.includes('coming soon') ? "default" : "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'not configured') return <XCircle className="h-4 w-4 text-destructive" />
    if (status === 'connected') return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  const getStatusBadge = (status: string) => {
    if (status === 'not configured') return <Badge variant="destructive">Not Configured</Badge>
    if (status === 'connected') return <Badge className="bg-green-600">Connected</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          WhatsApp Configuration Test
          <Button
            variant="outline"
            size="sm"
            onClick={testConfiguration}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Test Configuration
          </Button>
        </CardTitle>
        <CardDescription>
          Test your WhatsApp API configuration and connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? (
          <>
            {/* Twilio WhatsApp Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.twilio.status)}
                <div>
                  <h4 className="font-medium">Twilio WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">
                    {status.twilio.phoneNumber ? `Phone: ${status.twilio.phoneNumber}` : 'Not configured'}
                  </p>
                  {status.twilio.status.includes('error') && (
                    <p className="text-sm text-destructive">{status.twilio.status}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(status.twilio.status)}
            </div>

            {/* Configuration Details */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                {status.twilio.details.hasAccountSid ? 
                  <CheckCircle className="h-3 w-3 text-green-600" /> : 
                  <XCircle className="h-3 w-3 text-destructive" />
                }
                <span>Account SID</span>
              </div>
              <div className="flex items-center space-x-2">
                {status.twilio.details.hasAuthToken ? 
                  <CheckCircle className="h-3 w-3 text-green-600" /> : 
                  <XCircle className="h-3 w-3 text-destructive" />
                }
                <span>Auth Token</span>
              </div>
              <div className="flex items-center space-x-2">
                {status.twilio.details.hasPhoneNumber ? 
                  <CheckCircle className="h-3 w-3 text-green-600" /> : 
                  <XCircle className="h-3 w-3 text-destructive" />
                }
                <span>Phone Number</span>
              </div>
            </div>

            {/* Diagnostics */}
            {status.diagnostics && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Configuration Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Phone Type:</span>
                    <Badge variant={status.diagnostics.isSandboxNumber ? "secondary" : "default"}>
                      {status.diagnostics.isSandboxNumber ? "Sandbox" : "Production"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Credentials:</span>
                    <Badge variant={status.diagnostics.hasLiveCredentials ? "default" : "secondary"}>
                      {status.diagnostics.hasLiveCredentials ? "Live" : "Test"}
                    </Badge>
                  </div>
                  {status.diagnostics.recommendedAction && (
                    <p className="text-blue-700 dark:text-blue-300 mt-2">
                      <strong>Action:</strong> {status.diagnostics.recommendedAction}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Status</h4>
              <p className="text-sm text-muted-foreground">{status.recommendation}</p>
            </div>

            {/* Specific WhatsApp Error Help */}
            {status.twilio.status.includes('63007') && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  WhatsApp Configuration Issue (Error 63007)
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Your phone number is not configured as a WhatsApp Business sender. This is the most common WhatsApp setup issue.
                </p>
                <div className="text-sm text-red-600 dark:text-red-400">
                  <strong>Quick Solutions:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                    <li>Use WhatsApp Sandbox (+14155238886) for immediate testing</li>
                    <li>Enable WhatsApp capability for your current number in Twilio Console</li>
                    <li>Purchase a new Twilio number with WhatsApp pre-enabled</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Configuration Mismatch Warning */}
            {status.diagnostics && 
             status.diagnostics.hasLiveCredentials && 
             status.diagnostics.isSandboxNumber && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Configuration Mismatch Detected
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You're using live Twilio credentials with a sandbox number. For production WhatsApp, 
                  you need either test credentials with sandbox numbers, or live credentials with purchased numbers.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click "Test Configuration" to check your Twilio WhatsApp settings
          </div>
        )}
      </CardContent>
    </Card>
  )
}