import { useParams, Link } from "react-router-dom"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pause, Play, RefreshCw, CheckCircle, XCircle, Clock, Send, Eye, MousePointer, MessageSquare } from "lucide-react"
import { useCampaignDetails } from "@/hooks/useCampaignDetails"

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState("overview")
  
  const { 
    data: campaign, 
    isLoading, 
    messageStats,
    churchStats,
    engagementStats 
  } = useCampaignDetails(id!)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading campaign details...
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Campaign not found
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-blue-500'
      case 'paused': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const totalMessages = messageStats?.total || 0
  const sentMessages = messageStats?.sent || 0
  const failedMessages = messageStats?.failed || 0
  const progressPercentage = totalMessages > 0 ? (sentMessages / totalMessages) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
            {campaign.status}
          </Badge>
          {campaign.status === 'active' && (
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {failedMessages > 0 && (
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed
            </Button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Churches Targeted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churchStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentMessages}</div>
            <div className="text-xs text-muted-foreground">
              of {totalMessages} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMessages > 0 ? Math.round(((sentMessages) / totalMessages) * 100) : 0}%
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{failedMessages}</div>
            {failedMessages > 0 && (
              <div className="text-xs text-muted-foreground">
                Click retry to resend
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Message Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Message Types</CardTitle>
                <CardDescription>Breakdown by communication method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email</span>
                  <span className="font-medium">{messageStats?.email || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">SMS</span>
                  <span className="font-medium">{messageStats?.sms || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">WhatsApp</span>
                  <span className="font-medium">{messageStats?.whatsapp || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Message Status</CardTitle>
                <CardDescription>Current delivery status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Sent</span>
                  </div>
                  <span className="font-medium">{messageStats?.sent || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-medium">{messageStats?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <span className="font-medium">{messageStats?.failed || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>Detailed view of all sent messages</CardDescription>
            </CardHeader>
            <CardContent>
              {messageStats?.messages && messageStats.messages.length > 0 ? (
                <div className="space-y-4">
                  {messageStats.messages.map((message: any) => (
                    <div key={message.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(message.status)}`} />
                        <div>
                          <div className="font-medium">{message.type.toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">
                            To: {message.recipient_email || message.recipient_phone}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {message.sent_at ? new Date(message.sent_at).toLocaleString() : 'Not sent'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={message.status === 'sent' ? 'default' : message.status === 'failed' ? 'destructive' : 'outline'}>
                          {message.status}
                        </Badge>
                        {message.failed_reason && (
                          <div className="text-xs text-red-500 max-w-xs truncate">
                            {message.failed_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No messages found for this campaign
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Opens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">{engagementStats?.opened || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {engagementStats?.openRate || 0}% open rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">{engagementStats?.clicked || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {engagementStats?.clickRate || 0}% click rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Replies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span className="text-2xl font-bold">{engagementStats?.replied || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {engagementStats?.replyRate || 0}% reply rate
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Details</CardTitle>
              <CardDescription>Failed messages and error reasons</CardDescription>
            </CardHeader>
            <CardContent>
              {messageStats?.failedMessages && messageStats.failedMessages.length > 0 ? (
                <div className="space-y-4">
                  {messageStats.failedMessages.map((message: any) => (
                    <div key={message.id} className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-red-800 dark:text-red-200">
                            {message.type.toUpperCase()} - {message.recipient_email || message.recipient_phone}
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                            {message.failed_reason}
                          </div>
                          <div className="text-xs text-red-500 mt-1">
                            Failed at: {new Date(message.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No failed messages
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}