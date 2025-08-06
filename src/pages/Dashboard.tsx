
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Church, Mail, Users, TrendingUp, Plus, Send, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useChurches } from "@/hooks/useChurches"
import { useCampaigns, useCampaignStats } from "@/hooks/useCampaigns"
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog"
import AddChurchDialog from "@/components/AddChurchDialog"

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false);
  
  
  // Fetch real data
  const { data: churches = [] } = useChurches();
  const { data: campaigns = [] } = useCampaigns();
  const { data: stats } = useCampaignStats();
  
  // Calculate metrics
  const totalChurches = churches.length;
  const verifiedChurches = churches.filter(church => church.verified).length;
  const activeCampaigns = stats?.active || 0;
  const totalContacts = campaigns.reduce((sum, campaign) => sum + (campaign.church_count || 0), 0);
  
  // Calculate conversion rate (example: verified churches / total churches)
  const conversionRate = totalChurches > 0 ? Math.round((verifiedChurches / totalChurches) * 100) : 0;
  
  // Recent activity (last 5 campaigns)
  const recentCampaigns = campaigns.slice(0, 5);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('navigation.dashboard')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcome')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateCampaignDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('campaigns.newCampaign')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalChurches')}</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChurches}</div>
            <p className="text-xs text-muted-foreground">
              {verifiedChurches} {t('dashboard.verified')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeCampaigns')}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total || 0} total campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalContacts')}</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              across all campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.conversionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              church verification rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>
              {t('dashboard.recentActivity')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.status} • {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                {t('dashboard.noRecentActivity')}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>
              {t('dashboard.getStarted')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <AddChurchDialog 
              trigger={
                <Button variant="outline" className="w-full justify-start">
                  <Church className="h-4 w-4 mr-2" />
                  {t('dashboard.addNewChurch')}
                </Button>
              }
            />
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowCreateCampaignDialog(true)}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('dashboard.createCampaign')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/analytics')}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('dashboard.viewAnalytics')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateCampaignDialog 
        open={showCreateCampaignDialog} 
        onOpenChange={setShowCreateCampaignDialog}
        onCampaignCreated={() => {
          setShowCreateCampaignDialog(false);
          // Campaigns will automatically refetch due to React Query
        }}
      />
    </div>
  )
}
