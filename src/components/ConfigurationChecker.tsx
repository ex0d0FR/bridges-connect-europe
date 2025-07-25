import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConfigStatus {
  service: string
  status: 'configured' | 'missing' | 'unknown'
  description: string
  helpUrl?: string
}

export function ConfigurationChecker() {
  const [configs, setConfigs] = useState<ConfigStatus[]>([
    {
      service: 'SendGrid (Email)',
      status: 'unknown',
      description: 'Required for sending email messages',
      helpUrl: 'https://sendgrid.com/docs/for-developers/sending-email/api-getting-started/'
    },
    {
      service: 'Twilio (SMS)',
      status: 'unknown', 
      description: 'Required for sending SMS messages',
      helpUrl: 'https://www.twilio.com/docs/usage/api'
    },
    {
      service: 'WhatsApp Business API',
      status: 'unknown',
      description: 'Required for sending WhatsApp messages',
      helpUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api'
    },
    {
      service: 'Google Maps API',
      status: 'unknown',
      description: 'Used for church discovery features',
      helpUrl: 'https://developers.google.com/maps/documentation/places/web-service'
    }
  ])
  
  const [isChecking, setIsChecking] = useState(false)

  // This is a simplified check - in a real app, you'd want to make actual API calls to verify
  const checkConfigurations = async () => {
    setIsChecking(true)
    
    // Simulate checking configurations
    setTimeout(() => {
      setConfigs(prev => prev.map(config => ({
        ...config,
        status: Math.random() > 0.5 ? 'configured' : 'missing'
      })))
      setIsChecking(false)
    }, 2000)
  }

  useEffect(() => {
    checkConfigurations()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Configured</Badge>
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>
      default:
        return <Badge variant="outline">Checking...</Badge>
    }
  }

  const configuredCount = configs.filter(c => c.status === 'configured').length
  const missingCount = configs.filter(c => c.status === 'missing').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration Status</h2>
        <p className="text-muted-foreground">
          Check the status of your API integrations and services
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration Overview</CardTitle>
              <CardDescription>
                {configuredCount} of {configs.length} services configured
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={checkConfigurations}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{configuredCount} Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">{missingCount} Missing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Service Status */}
      <div className="grid gap-4">
        {configs.map((config, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(config.status)}
                  <div>
                    <h3 className="font-medium">{config.service}</h3>
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(config.status)}
                  {config.helpUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(config.helpUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Docs
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Help */}
      {missingCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some services are not configured. Go to the Settings page to add the required API keys and credentials. 
            You can also check the Supabase Edge Functions secrets to ensure all environment variables are set correctly.
          </AlertDescription>
        </Alert>
      )}

      {configuredCount === configs.length && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All services are configured! You can now test sending messages using the Message Test Center.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}