
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your outreach automation settings
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic configuration for your outreach campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input 
                  id="org-name" 
                  placeholder="Missionary Bridges Conference"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contact-email">Primary Contact Email</Label>
                <Input 
                  id="contact-email" 
                  type="email"
                  placeholder="contact@missionarybridges.org"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="event-date">Conference Date</Label>
                <Input 
                  id="event-date" 
                  placeholder="October 2024"
                />
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure your email sending settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sender-name">Sender Name</Label>
                <Input 
                  id="sender-name" 
                  placeholder="Missionary Bridges Team"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sender-email">Sender Email</Label>
                <Input 
                  id="sender-email" 
                  type="email"
                  placeholder="invitations@missionarybridges.org"
                />
              </div>

              <Separator />
              
              <div className="grid gap-2">
                <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                <Input 
                  id="sendgrid-key" 
                  type="password"
                  placeholder="Enter your SendGrid API key"
                />
              </div>

              <Button>Save Email Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging">
          <Card>
            <CardHeader>
              <CardTitle>SMS & WhatsApp Configuration</CardTitle>
              <CardDescription>
                Set up messaging services for fallback communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="twilio-sid">Twilio Account SID</Label>
                <Input 
                  id="twilio-sid" 
                  placeholder="Enter your Twilio Account SID"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="twilio-token">Twilio Auth Token</Label>
                <Input 
                  id="twilio-token" 
                  type="password"
                  placeholder="Enter your Twilio Auth Token"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="whatsapp-number">WhatsApp Business Number</Label>
                <Input 
                  id="whatsapp-number" 
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <Button>Save Messaging Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>External Integrations</CardTitle>
              <CardDescription>
                Configure connections to external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="google-api">Google Maps API Key</Label>
                <Input 
                  id="google-api" 
                  type="password"
                  placeholder="For church discovery via Google Maps"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="apify-token">Apify API Token</Label>
                <Input 
                  id="apify-token" 
                  type="password"
                  placeholder="For web scraping church directories"
                />
              </div>

              <Button>Save Integration Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
