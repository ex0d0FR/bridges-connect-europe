
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Users, Mail, MessageSquare, Globe, Eye, MousePointer, Reply } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { useCampaignStats, useMessageStats, useChurchStats, useEngagementStats } from "@/hooks/useAnalytics"
import { useCampaigns } from "@/hooks/useCampaigns"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { data: campaignStats, isLoading: loadingCampaigns } = useCampaignStats();
  const { data: messageStats, isLoading: loadingMessages } = useMessageStats();
  const { data: churchStats, isLoading: loadingChurches } = useChurchStats();
  const { data: engagementStats, isLoading: loadingEngagement } = useEngagementStats();
  const { data: campaigns } = useCampaigns();

  const chartConfig = {
    sent: {
      label: "Sent",
      color: "hsl(var(--chart-1))",
    },
    opened: {
      label: "Opened",
      color: "hsl(var(--chart-2))",
    },
    clicked: {
      label: "Clicked", 
      color: "hsl(var(--chart-3))",
    },
    replied: {
      label: "Replied",
      color: "hsl(var(--chart-4))",
    },
  };

  // Prepare chart data
  const messageTypeData = messageStats ? [
    { name: 'Email', value: messageStats.email_messages },
    { name: 'SMS', value: messageStats.sms_messages },
    { name: 'WhatsApp', value: messageStats.whatsapp_messages },
  ].filter(item => item.value > 0) : [];

  const countryData = churchStats?.churches_by_country ? 
    Object.entries(churchStats.churches_by_country).map(([country, count]) => ({
      name: country,
      value: count
    })) : [];

  const campaignPerformanceData = campaigns?.map(campaign => ({
    name: campaign.name,
    messages: campaign.message_count || 0,
    status: campaign.status
  })) || [];

  const engagementData = engagementStats ? [
    { name: 'Sent', value: engagementStats.total_sent, color: 'hsl(var(--chart-1))' },
    { name: 'Opened', value: engagementStats.total_opened, color: 'hsl(var(--chart-2))' },
    { name: 'Clicked', value: engagementStats.total_clicked, color: 'hsl(var(--chart-3))' },
    { name: 'Replied', value: engagementStats.total_replied, color: 'hsl(var(--chart-4))' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your outreach performance and engagement
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingMessages ? "..." : messageStats?.total_messages || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Messages sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingEngagement ? "..." : `${engagementStats?.open_rate || '0.00'}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Email open rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingEngagement ? "..." : `${engagementStats?.click_rate || '0.00'}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall click rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
                <Reply className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingEngagement ? "..." : `${engagementStats?.reply_rate || '0.00'}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Response rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Types Distribution</CardTitle>
                <CardDescription>
                  Breakdown of sent messages by channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messageTypeData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={messageTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {messageTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No message data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Funnel</CardTitle>
                <CardDescription>
                  Message engagement progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                {engagementData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No engagement data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Overview</CardTitle>
                <CardDescription>
                  Summary of your campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {loadingCampaigns ? "..." : campaignStats?.active_campaigns || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {loadingCampaigns ? "..." : campaignStats?.draft_campaigns || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Draft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {loadingCampaigns ? "..." : campaignStats?.completed_campaigns || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {loadingCampaigns ? "..." : campaignStats?.total_campaigns || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Messages sent per campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaignPerformanceData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={campaignPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="messages" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No campaign data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sent</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingEngagement ? "..." : engagementStats?.total_sent || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Opened</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingEngagement ? "..." : engagementStats?.total_opened || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clicked</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingEngagement ? "..." : engagementStats?.total_clicked || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Replied</CardTitle>
                  <Reply className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingEngagement ? "..." : engagementStats?.total_replied || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Rates</CardTitle>
                <CardDescription>
                  Detailed engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Open Rate</span>
                    <span className="font-bold">{engagementStats?.open_rate || '0.00'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Click Rate</span>
                    <span className="font-bold">{engagementStats?.click_rate || '0.00'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Reply Rate</span>
                    <span className="font-bold">{engagementStats?.reply_rate || '0.00'}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Church Distribution</CardTitle>
                  <CardDescription>
                    Churches by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Churches</span>
                      <span className="font-bold">{churchStats?.total_churches || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Verified Churches</span>
                      <span className="font-bold">{churchStats?.verified_churches || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Chart</CardTitle>
                  <CardDescription>
                    Distribution by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {countryData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={countryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {countryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No geographic data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {churchStats?.churches_by_country && Object.keys(churchStats.churches_by_country).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Country Breakdown</CardTitle>
                  <CardDescription>
                    Detailed church counts by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(churchStats.churches_by_country).map(([country, count]) => (
                      <div key={country} className="flex justify-between items-center">
                        <span>{country}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
