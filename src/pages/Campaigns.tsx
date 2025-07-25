
import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Send, Users, BarChart3, Mail, MessageSquare, MessageCircle } from "lucide-react"
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog"
import { ManageCampaignChurchesDialog } from "@/components/ManageCampaignChurchesDialog"
import { useCampaigns, useCampaignStats, useLaunchCampaign, Campaign } from "@/hooks/useCampaigns"

export default function Campaigns() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showManageChurchesDialog, setShowManageChurchesDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  
  const { data: campaigns = [], isLoading, refetch: refetchCampaigns } = useCampaigns()
  const { data: stats } = useCampaignStats()
  const launchCampaignMutation = useLaunchCampaign()

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'paused':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleLaunchCampaign = (campaignId: string) => {
    launchCampaignMutation.mutate(campaignId)
  }

  const handleManageChurches = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowManageChurchesDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your outreach campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.draft || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Manage your email and messaging campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">No campaigns yet</div>
              <p className="text-sm mb-4">
                Create your first campaign to start reaching out to churches in your area.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManageChurches(campaign)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Churches
                    </Button>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      disabled={campaign.status !== 'draft' || launchCampaignMutation.isPending}
                      onClick={() => handleLaunchCampaign(campaign.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {launchCampaignMutation.isPending ? "Launching..." : "Launch"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCampaignCreated={refetchCampaigns}
      />
      
      {selectedCampaign && (
        <ManageCampaignChurchesDialog
          open={showManageChurchesDialog}
          onOpenChange={setShowManageChurchesDialog}
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
          onUpdate={refetchCampaigns}
        />
      )}
    </div>
  )
}
