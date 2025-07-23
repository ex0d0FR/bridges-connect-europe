import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, MessageSquare, Globe, MessageCircle, Edit, Trash2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { CreateTemplateDialog } from "@/components/CreateTemplateDialog"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  name: string
  content: string
  type: 'email' | 'sms' | 'whatsapp'
  language: string
  created_at: string
}

export default function Templates() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Template deleted successfully",
      })

      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('templates.title')}</h1>
          <p className="text-muted-foreground">
            Create and manage email, SMS, and WhatsApp templates
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('templates.createTemplate')}
        </Button>
      </div>

      {/* Template Types */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <Mail className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">{t('templates.emailTemplates')}</CardTitle>
            <CardDescription>
              Create personalized email invitations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={() => setShowCreateDialog(true)}>
              Create Email Template
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">{t('templates.smsTemplates')}</CardTitle>
            <CardDescription>
              Short message templates for mobile outreach
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={() => setShowCreateDialog(true)}>
              Create SMS Template
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">WhatsApp Templates</CardTitle>
            <CardDescription>
              Rich media messages for WhatsApp Business
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={() => setShowCreateDialog(true)}>
              Create WhatsApp Template
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <Globe className="h-8 w-8 mx-auto text-primary" />
            <CardTitle className="text-lg">Multi-language</CardTitle>
            <CardDescription>
              Templates in English, French, and Spanish
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Manage Languages
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Existing Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            Manage your existing message templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">{t('templates.noTemplates')}</div>
              <p className="text-sm mb-4">
                Start by creating your first template for outreach campaigns via Email, SMS, or WhatsApp.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('templates.createFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {getMessageTypeIcon(template.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {template.type}
                        </Badge>
                        <Badge variant="outline">
                          {template.language.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTemplateCreated={fetchTemplates}
      />
    </div>
  )
}
