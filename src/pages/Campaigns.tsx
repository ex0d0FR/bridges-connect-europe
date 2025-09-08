
import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Send, Users, BarChart3, Mail, MessageSquare, MessageCircle, Search } from "lucide-react"
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog"
import { EditCampaignDialog } from "@/components/EditCampaignDialog"
import { ManageCampaignChurchesDialog } from "@/components/ManageCampaignChurchesDialog"
import { CampaignActionsDropdown } from "@/components/CampaignActionsDropdown"
import { useCampaigns, useCampaignStats, useLaunchCampaign, useDeleteCampaign, useUpdateCampaignStatus, Campaign } from "@/hooks/useCampaigns"
import { useToast } from "@/hooks/use-toast"

export default function Campaigns() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showManageChurchesDialog, setShowManageChurchesDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const { data: campaigns = [], isLoading, refetch: refetchCampaigns } = useCampaigns()
  const { data: stats } = useCampaignStats()
  const launchCampaignMutation = useLaunchCampaign()
  const deleteCampaignMutation = useDeleteCampaign()
  const updateStatusMutation = useUpdateCampaignStatus()
  const { toast } = useToast()

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
    launchCampaignMutation.mutate({ campaignId })
  }

  const handleManageChurches = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowManageChurchesDialog(true)
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowEditDialog(true)
  }

  const handleDeleteCampaign = (campaignId: string) => {
    deleteCampaignMutation.mutate(campaignId)
  }

  const handleDuplicateCampaign = (campaign: Campaign) => {
    // Create a new campaign with similar data
    setSelectedCampaign({
      ...campaign,
      name: `${campaign.name} (Copy)`,
      status: 'draft' as const
    })
    setShowCreateDialog(true)
  }

  const handleStatusChange = (campaignId: string, status: Campaign['status']) => {
    updateStatusMutation.mutate({ campaignId, status })
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Manage your email and messaging campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            searchTerm || statusFilter !== "all" ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-4">No campaigns match your filters</div>
                <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("all") }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
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
            )
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {campaign.description || "No description"}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {(campaign as any).campaign_churches?.[0]?.count || 0} churches
                          </span>
                          <span className="flex items-center">
                            <Send className="h-3 w-3 mr-1" />
                            {(campaign as any).messages?.[0]?.count || 0} messages
                          </span>
                        </div>
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
                      Manage Churches
                    </Button>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                    {campaign.status === 'draft' && (
                      <Button 
                        size="sm" 
                        disabled={launchCampaignMutation.isPending}
                        onClick={() => handleLaunchCampaign(campaign.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {launchCampaignMutation.isPending ? "Launching..." : "Launch"}
                      </Button>
                    )}
                    <CampaignActionsDropdown
                      campaign={campaign}
                      onEdit={handleEditCampaign}
                      onDelete={handleDeleteCampaign}
                      onDuplicate={handleDuplicateCampaign}
                      onStatusChange={handleStatusChange}
                      isDeleting={deleteCampaignMutation.isPending}
                    />
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
      
      <EditCampaignDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        campaign={selectedCampaign}
        onCampaignUpdated={refetchCampaigns}
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
