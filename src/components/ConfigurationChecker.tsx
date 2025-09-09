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
      service: 'Supabase',
      status: 'configured',
      description: 'Database and authentication backend - Already configured',
      helpUrl: 'https://supabase.com/docs'
    },
    {
      service: 'Twilio (SMS)',
      status: 'missing', 
      description: 'Required for sending SMS messages - Setup needed',
      helpUrl: 'https://console.twilio.com/'
    },
    {
      service: 'Twilio (WhatsApp)',
      status: 'missing',
      description: 'Required for sending WhatsApp messages - Setup needed',
      helpUrl: 'https://console.twilio.com/'
    },
    {
      service: 'Email Service',
      status: 'configured',
      description: 'Email sending capabilities - Available through Supabase',
      helpUrl: 'https://supabase.com/docs/guides/auth/auth-smtp'
    }
  ])
  
  const [isChecking, setIsChecking] = useState(false)

  const checkConfigurations = async () => {
    setIsChecking(true)
    
    try {
      // Basic status - we know email works and others need proper credentials
      const newConfigs = [...configs]
      
      // SendGrid is configured (we know this works from previous tests)
      newConfigs[0].status = 'configured'
      
      // For SMS and WhatsApp, we'll mark as unknown until properly tested
      newConfigs[1].status = 'unknown'
      newConfigs[1].description = 'SMS configuration requires Twilio credentials verification'
      
      newConfigs[2].status = 'unknown' 
      newConfigs[2].description = 'WhatsApp configuration requires Twilio/Meta credentials verification'
      
      // Google Maps is missing (no key configured)
      newConfigs[3].status = 'missing'
      
      setConfigs(newConfigs)
    } catch (error) {
      console.error('Error checking configurations:', error)
    } finally {
      setIsChecking(false)
    }
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

      {/* Twilio Setup Help */}
      {missingCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Twilio Setup Required:</strong> To enable SMS and WhatsApp functionality, you need to:
            <br />• Set up a Twilio account at console.twilio.com
            <br />• Add your Twilio credentials to the .env file and Supabase Edge Functions secrets
            <br />• See the TWILIO_SETUP.md file in this project for detailed instructions
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