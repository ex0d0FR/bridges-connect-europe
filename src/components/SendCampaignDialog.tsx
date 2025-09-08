import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Calendar, Users, MessageSquare, AlertTriangle } from "lucide-react"
import { useLaunchCampaign } from "@/hooks/useCampaigns"
import type { CampaignDetails } from "@/hooks/useCampaignDetails"

interface SendCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: CampaignDetails | null
  churchCount: number
  onCampaignSent?: () => void
}

export default function SendCampaignDialog({ 
  open, 
  onOpenChange, 
  campaign, 
  churchCount,
  onCampaignSent 
}: SendCampaignDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const launchCampaign = useLaunchCampaign()

  // Load user's templates to allow explicit selection
  const { data: templates } = useQuery({
    queryKey: ['my-templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, type, subject')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Array<{ id: string; name: string; type: 'email' | 'sms' | 'whatsapp'; subject?: string }>
    },
  })

  const handleSend = async () => {
    if (!campaign || !isConfirmed || !selectedTemplateId) return

    try {
      await launchCampaign.mutateAsync({ campaignId: campaign.id, templateId: selectedTemplateId })
      onCampaignSent?.()
      onOpenChange(false)
      setIsConfirmed(false)
      setSelectedTemplateId(undefined)
    } catch (error) {
      console.error('Failed to send campaign:', error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setIsConfirmed(false)
    setSelectedTemplateId(undefined)
  }

  if (!campaign) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Campaign
          </DialogTitle>
          <DialogDescription>
            Review and confirm sending your campaign to all selected churches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Summary */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">{campaign.name}</h4>
              {campaign.description && (
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{churchCount} churches</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Template Selection */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Select template</h5>
            {!templates || templates.length === 0 ? (
              <div className="text-center p-4 border border-dashed rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">No templates available</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/templates">Create Template</a>
                </Button>
              </div>
            ) : (
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger aria-label="Select campaign template">
                  <SelectValue placeholder="Choose a template (email/SMS/WhatsApp)" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              The selected template determines the channel (email, SMS, or WhatsApp).
            </p>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Once sent, messages cannot be recalled. Make sure your template and contact information are correct.
            </AlertDescription>
          </Alert>

          {/* Campaign Details */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">What will be sent:</h5>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                <span>Messages will be sent based on available contact information</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                <span>Email, SMS, and WhatsApp as configured</span>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confirm-send"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="confirm-send" className="text-sm">
              I confirm that I want to send this campaign to {churchCount} churches
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={!isConfirmed || !selectedTemplateId || launchCampaign.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {launchCampaign.isPending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}