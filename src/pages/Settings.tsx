
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppConfigTest } from "@/components/WhatsAppConfigTest"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { MessageTestCenter } from "@/components/MessageTestCenter"
import { ConfigurationChecker } from "@/components/ConfigurationChecker"
import { useForm } from "react-hook-form"
import { useSettings } from "@/hooks/useSettings"
import { useEffect } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export default function Settings() {
  const { settings, isLoading, saveSettings, isSaving } = useSettings();
  
  const generalForm = useForm({
    defaultValues: {
      organization_name: '',
      primary_contact_email: '',
      conference_date: '',
    },
  });

  const emailForm = useForm({
    defaultValues: {
      sender_name: '',
      sender_email: '',
      sendgrid_api_key: '',
    },
  });

  const messagingForm = useForm({
    defaultValues: {
      twilio_account_sid: '',
      twilio_auth_token: '',
      whatsapp_phone_number: '',
    },
  });

  const integrationsForm = useForm({
    defaultValues: {
      google_maps_api_key: '',
      apify_api_token: '',
    },
  });

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      generalForm.reset({
        organization_name: settings.organization_name || '',
        primary_contact_email: settings.primary_contact_email || '',
        conference_date: settings.conference_date || '',
      });
      
      emailForm.reset({
        sender_name: settings.sender_name || '',
        sender_email: settings.sender_email || '',
        sendgrid_api_key: settings.sendgrid_api_key || '',
      });
      
      messagingForm.reset({
        twilio_account_sid: settings.twilio_account_sid || '',
        twilio_auth_token: settings.twilio_auth_token || '',
        whatsapp_phone_number: settings.whatsapp_phone_number || '',
      });
      
      integrationsForm.reset({
        google_maps_api_key: settings.google_maps_api_key || '',
        apify_api_token: settings.apify_api_token || '',
      });
    }
  }, [settings, generalForm, emailForm, messagingForm, integrationsForm]);

  const onGeneralSubmit = (data: any) => {
    saveSettings({ ...settings, ...data });
  };

  const onEmailSubmit = (data: any) => {
    saveSettings({ ...settings, ...data });
  };

  const onMessagingSubmit = (data: any) => {
    saveSettings({ ...settings, ...data });
  };

  const onIntegrationsSubmit = (data: any) => {
    saveSettings({ ...settings, ...data });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your outreach automation settings
        </p>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Test Center</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <MessageTestCenter />
        </TabsContent>

        <TabsContent value="config">
          <ConfigurationChecker />
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic configuration for your outreach campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4">
                  <FormField
                    control={generalForm.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Missionary Bridges Conference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="primary_contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@missionarybridges.org" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="conference_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conference Date</FormLabel>
                        <FormControl>
                          <Input placeholder="October 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
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
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="sender_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Missionary Bridges Team" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={emailForm.control}
                    name="sender_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="invitations@missionarybridges.org" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                  
                  <FormField
                    control={emailForm.control}
                    name="sendgrid_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SendGrid API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your SendGrid API key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                </form>
              </Form>
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
              <Form {...messagingForm}>
                <form onSubmit={messagingForm.handleSubmit(onMessagingSubmit)} className="space-y-4">
                  <FormField
                    control={messagingForm.control}
                    name="twilio_account_sid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Account SID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your Twilio Account SID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={messagingForm.control}
                    name="twilio_auth_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Auth Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your Twilio Auth Token" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={messagingForm.control}
                    name="whatsapp_phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Business Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 1 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Messaging Settings'}
                  </Button>
                </form>
              </Form>
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
              <Form {...integrationsForm}>
                <form onSubmit={integrationsForm.handleSubmit(onIntegrationsSubmit)} className="space-y-4">
                  <FormField
                    control={integrationsForm.control}
                    name="google_maps_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Maps API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="For church discovery via Google Maps" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={integrationsForm.control}
                    name="apify_api_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apify API Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="For web scraping church directories" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Integration Settings'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* WhatsApp Configuration Test */}
          <WhatsAppConfigTest />
        </TabsContent>
      </Tabs>
    </div>
  )
}
