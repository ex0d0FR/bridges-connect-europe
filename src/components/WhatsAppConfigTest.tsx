import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface ConfigStatus {
  evolutionApi: {
    configured: boolean
    connected: boolean
    instance: string | null
    error?: string
  }
  whatsappApi: {
    configured: boolean
    connected: boolean
    phoneNumber: string | null
    error?: string
  }
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
      
      if (data.evolutionApi.connected || data.whatsappApi.connected) {
        toast({
          title: "Configuration Test Complete",
          description: "WhatsApp configuration tested successfully",
        })
      } else {
        toast({
          title: "Configuration Issues Found",
          description: "Please check your WhatsApp settings",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error testing WhatsApp configuration:', error)
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test WhatsApp configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (configured: boolean, connected: boolean) => {
    if (!configured) return <XCircle className="h-4 w-4 text-destructive" />
    if (connected) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  const getStatusBadge = (configured: boolean, connected: boolean) => {
    if (!configured) return <Badge variant="destructive">Not Configured</Badge>
    if (connected) return <Badge className="bg-green-600">Connected</Badge>
    return <Badge variant="outline">Configured but Not Connected</Badge>
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
            {/* Evolution API Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.evolutionApi.configured, status.evolutionApi.connected)}
                <div>
                  <h4 className="font-medium">Evolution API</h4>
                  <p className="text-sm text-muted-foreground">
                    {status.evolutionApi.instance ? `Instance: ${status.evolutionApi.instance}` : 'Not configured'}
                  </p>
                  {status.evolutionApi.error && (
                    <p className="text-sm text-destructive">{status.evolutionApi.error}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(status.evolutionApi.configured, status.evolutionApi.connected)}
            </div>

            {/* WhatsApp Business API Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.whatsappApi.configured, status.whatsappApi.connected)}
                <div>
                  <h4 className="font-medium">WhatsApp Business API</h4>
                  <p className="text-sm text-muted-foreground">
                    {status.whatsappApi.phoneNumber ? `Phone: ${status.whatsappApi.phoneNumber}` : 'Not configured'}
                  </p>
                  {status.whatsappApi.error && (
                    <p className="text-sm text-destructive">{status.whatsappApi.error}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(status.whatsappApi.configured, status.whatsappApi.connected)}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Recommendation</h4>
              <p className="text-sm text-muted-foreground">{status.recommendation}</p>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click "Test Configuration" to check your WhatsApp settings
          </div>
        )}
      </CardContent>
    </Card>
  )
}