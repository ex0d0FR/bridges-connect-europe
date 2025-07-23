import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, MessageSquare, Globe, MessageCircle } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function Templates() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('templates.title')}</h1>
          <p className="text-muted-foreground">
            Create and manage email, SMS, and WhatsApp templates
          </p>
        </div>
        <Button>
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
            <Button variant="outline" className="w-full">
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
            <Button variant="outline" className="w-full">
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
            <Button variant="outline" className="w-full">
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
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">{t('templates.noTemplates')}</div>
            <p className="text-sm mb-4">
              Start by creating your first template for outreach campaigns via Email, SMS, or WhatsApp.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('templates.createFirst')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
