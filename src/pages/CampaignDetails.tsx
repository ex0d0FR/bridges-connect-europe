import { useParams, Link } from "react-router-dom"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pause, Play, RefreshCw, CheckCircle, XCircle, Clock, Send, Eye, MousePointer, MessageSquare, Settings, Users, Phone, Mail, Plus, Calendar, User } from "lucide-react"
import { useCampaignDetails, useRetryFailedMessages } from "@/hooks/useCampaignDetails"
import { useUpdateCampaignStatus } from "@/hooks/useCampaigns"
import { useCampaignContacts, useAddCampaignContact, useRemoveCampaignContact } from "@/hooks/useCampaignContacts"
import { useFollowUpTasks } from "@/hooks/useFollowUpTasks"
import SendCampaignDialog from "@/components/SendCampaignDialog"
import CreateFollowUpTaskDialog from "@/components/CreateFollowUpTaskDialog"
import CampaignDebugInfo from "@/components/CampaignDebugInfo"

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState("overview")
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  
  const { 
    data: campaign, 
    isLoading, 
    messageStats,
    churchStats,
    engagementStats 
  } = useCampaignDetails(id!)
  
  const { data: contacts } = useCampaignContacts(id!)
  const { data: followUpTasks } = useFollowUpTasks(id!)
  const retryFailedMessages = useRetryFailedMessages()
  const updateCampaignStatus = useUpdateCampaignStatus()

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
          
          {/* Send Campaign Button */}
          {campaign.status === 'draft' && (
            <Button 
              size="sm"
              onClick={() => setShowSendDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          )}
          
          {/* Pause/Resume */}
          {campaign.status === 'active' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateCampaignStatus.mutate({ campaignId: id!, status: 'paused' })}
              disabled={updateCampaignStatus.isPending}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateCampaignStatus.mutate({ campaignId: id!, status: 'active' })}
              disabled={updateCampaignStatus.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}

          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateCampaignStatus.mutate({ campaignId: id!, status: 'completed' })}
              disabled={updateCampaignStatus.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          {/* Retry Failed */}
          {failedMessages > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => retryFailedMessages.mutate({ campaignId: id! })}
              disabled={retryFailedMessages.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${retryFailedMessages.isPending ? 'animate-spin' : ''}`} />
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

      {/* Debug Information - only show if there are issues */}
      {(failedMessages > 0 || campaign.status === 'draft') && (
        <CampaignDebugInfo campaignId={id!} />
      )}

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
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

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campaign Contacts</CardTitle>
                  <CardDescription>Manage church contacts for this campaign</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowCreateTaskDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Church</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {contact.contacts?.first_name} {contact.contacts?.last_name}
                              </div>
                              {contact.contacts?.position && (
                                <div className="text-sm text-muted-foreground">
                                  {contact.contacts.position}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{contact.churches?.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {contact.contacts?.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {contact.contacts.email}
                              </div>
                            )}
                            {contact.contacts?.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {contact.contacts.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{contact.engagement_score}/100</div>
                            <Progress value={contact.engagement_score} className="w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contacts found for this campaign</p>
                  <p className="text-sm">Add contacts to track engagement and manage follow-ups</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Follow-up Tasks</CardTitle>
                  <CardDescription>Track and manage follow-up activities</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowCreateTaskDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {followUpTasks && followUpTasks.length > 0 ? (
                <div className="space-y-4">
                  {followUpTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant={
                              task.priority === 'urgent' ? 'destructive' :
                              task.priority === 'high' ? 'default' :
                              'outline'
                            }>
                              {task.priority}
                            </Badge>
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                            </div>
                            {task.churches?.name && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {task.churches.name}
                              </div>
                            )}
                            {task.contacts && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.contacts.first_name} {task.contacts.last_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No follow-up tasks yet</p>
                  <p className="text-sm">Create tasks to track your outreach activities</p>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => retryFailedMessages.mutate({ campaignId: id!, messageId: message.id })}
                          disabled={retryFailedMessages.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${retryFailedMessages.isPending ? 'animate-spin' : ''}`} />
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

      {/* Dialogs */}
      <SendCampaignDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        campaign={campaign}
        churchCount={churchStats?.total || 0}
        onCampaignSent={() => {
          // Refresh campaign data after sending
        }}
      />

      <CreateFollowUpTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        campaignId={id!}
      />
    </div>
  )
}