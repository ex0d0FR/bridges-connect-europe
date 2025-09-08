import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Settings, MessageSquare, Phone, Mail } from "lucide-react"

interface CampaignDebugInfoProps {
  campaignId: string
}

export default function CampaignDebugInfo({ campaignId }: CampaignDebugInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Check templates availability
  const { data: templates } = useQuery({
    queryKey: ['debug-templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, type, created_at')
        .eq('created_by', user.id)
      if (error) throw error
      return data
    },
  })

  // Check settings
  const { data: settings } = useQuery({
    queryKey: ['debug-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  // Check failed messages for this campaign
  const { data: failedMessages } = useQuery({
    queryKey: ['debug-failed-messages', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('messages')
        .select('id, type, status, failed_reason, recipient_email, recipient_phone')
        .eq('campaign_id', campaignId)
        .eq('status', 'failed')
        .eq('created_by', user.id)
        .limit(5)
      if (error) throw error
      return data
    },
  })

  const hasEmailTemplates = templates?.some(t => t.type === 'email') || false
  const hasSMSTemplates = templates?.some(t => t.type === 'sms') || false  
  const hasWhatsAppTemplates = templates?.some(t => t.type === 'whatsapp') || false
  const hasEmailConfig = !!settings?.sender_email
  const hasSMSConfig = !!settings?.twilio_phone_number
  const hasWhatsAppConfig = !!settings?.whatsapp_phone_number || !!settings?.twilio_phone_number

  const getStatusIcon = (isConfigured: boolean) => 
    isConfigured ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100/50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <CardTitle className="text-sm">Campaign Debug Info</CardTitle>
                {failedMessages?.length ? (
                  <Badge variant="destructive" className="ml-2">
                    {failedMessages.length} failed
                  </Badge>
                ) : null}
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription className="text-xs">
              Configuration status and troubleshooting info
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Template Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Templates
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  {getStatusIcon(hasEmailTemplates)}
                  <Mail className="h-3 w-3" />
                  <span>Email</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(hasSMSTemplates)}
                  <MessageSquare className="h-3 w-3" />
                  <span>SMS</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(hasWhatsAppTemplates)}
                  <Phone className="h-3 w-3" />
                  <span>WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Configuration Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  {getStatusIcon(hasEmailConfig)}
                  <Mail className="h-3 w-3" />
                  <span>Email</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(hasSMSConfig)}
                  <MessageSquare className="h-3 w-3" />
                  <span>SMS</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(hasWhatsAppConfig)}
                  <Phone className="h-3 w-3" />
                  <span>WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Recent Failures */}
            {failedMessages?.length ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Recent Failures
                </h4>
                <div className="space-y-1">
                  {failedMessages.slice(0, 3).map((msg) => (
                    <div key={msg.id} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                      <div className="font-medium text-red-700">
                        {msg.type.toUpperCase()} → {msg.recipient_email || msg.recipient_phone}
                      </div>
                      <div className="text-red-600 truncate">
                        {msg.failed_reason || 'Unknown error'}
                      </div>
                    </div>
                  ))}
                  {failedMessages.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      And {failedMessages.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" asChild>
                <a href="/templates" className="text-xs">
                  Manage Templates
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/settings" className="text-xs">
                  Configure Settings
                </a>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}