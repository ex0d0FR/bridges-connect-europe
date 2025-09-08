import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  const launchCampaign = useLaunchCampaign()

  const handleSend = async () => {
    if (!campaign || !isConfirmed) return

    try {
      await launchCampaign.mutateAsync(campaign.id)
      onCampaignSent?.()
      onOpenChange(false)
      setIsConfirmed(false)
    } catch (error) {
      console.error('Failed to send campaign:', error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setIsConfirmed(false)
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
            disabled={!isConfirmed || launchCampaign.isPending}
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