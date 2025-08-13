import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Mail, MessageSquare, MessageCircle } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface TestMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: {
    id: string
    name: string
    type: 'email' | 'sms' | 'whatsapp'
    subject?: string
    content: string
  }
}

export function TestMessageDialog({ open, onOpenChange, template }: TestMessageDialogProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phone: ""
  })
  const { toast } = useToast()

  const formatEmailPreview = (content: string): string => {
    // Check if content is already HTML
    const isHTML = /<[a-z][\s\S]*>/i.test(content);
    
    if (isHTML) {
      return content;
    }
    
    // Convert plain text to HTML for preview
    let htmlContent = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/undefined/g, '');
    
    return `
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              padding: 16px;
              margin: 0;
            }
            p { margin: 0 0 16px 0; }
          </style>
        </head>
        <body>
          <p>${htmlContent}</p>
        </body>
      </html>
    `;
  };

  const handleSendTest = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let functionName: string
      let body: any

      if (template.type === 'email') {
        if (!formData.email) {
          throw new Error(t('validation.emailRequired'))
        }
        functionName = 'send-email'
        body = {
          to: formData.email,
          subject: template.subject || `Test: ${template.name}`,
          content: template.content,
          churchId: '00000000-0000-0000-0000-000000000000',
          isTest: true
        }
      } else if (template.type === 'sms') {
        if (!formData.phone) {
          throw new Error(t('validation.phoneRequired'))
        }
        functionName = 'send-sms'
        const cleanedPhone = formData.phone.replace(/[^\d+]/g, '').trim()
        const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`
        body = {
          to: formattedPhone,
          content: template.content,
          churchId: '00000000-0000-0000-0000-000000000000', // Test church ID
          isTest: true
        }
      } else if (template.type === 'whatsapp') {
        if (!formData.phone) {
          throw new Error("Phone number is required for WhatsApp templates")
        }
        functionName = 'send-whatsapp'
        // Ensure phone number has proper format
        const cleanedPhone = formData.phone.replace(/[^\d+]/g, '').trim()
        const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`
        body = {
          recipient_phone: formattedPhone,
          message_body: template.content,
          message_type: 'text',
          provider: 'evolution', // Prefer Evolution API
          isTest: true
        }
      } else {
        throw new Error("Invalid template type")
      }

      console.log(`Sending test ${template.type} with body:`, body)
      
      const { data, error } = await supabase.functions.invoke(functionName, { 
        body
      })

      if (error) {
        console.error('Test message error:', error)
        throw new Error(`Function error: ${error.message || 'Unknown error'}`)
      }

      if (data?.error) {
        console.error('Function returned error:', data.error)
        throw new Error(data.error)
      }

      console.log('Test message response:', data)

      toast({
        title: t('testMessage.testMessageSent'),
        description: t('testMessage.testMessageSentSuccess'),
      })

      onOpenChange(false)
      setFormData({ email: "", phone: "" })
    } catch (error: any) {
      console.error('Error sending test message:', error)
      toast({
        title: t('common.error'),
        description: error?.message || t('testMessage.testMessageFailed'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = () => {
    switch (template.type) {
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'sms':
        return <MessageSquare className="h-5 w-5" />
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5" />
      default:
        return <MessageSquare className="h-5 w-5" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {template.type === 'email' ? t('testMessage.testEmailTemplate') : template.type === 'sms' ? t('testMessage.testSmsTemplate') : t('testMessage.testWhatsappTemplate')}
          </DialogTitle>
          <DialogDescription>
            {t('testMessage.sendTestMessage')} "{template.name}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {template.type === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">{t('testMessage.testEmailAddress')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('placeholders.yourEmail')}
                required
              />
            </div>
          )}
          
          {(template.type === 'sms' || template.type === 'whatsapp') && (
            <div className="space-y-2">
              <Label htmlFor="phone">{t('testMessage.testPhoneNumber')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('placeholders.phoneNumber')}
                required
              />
            </div>
          )}

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">{t('testMessage.messagePreview')}:</p>
            {template.subject && (
              <p className="text-sm text-muted-foreground mb-1">
                <strong>{t('forms.subject')}:</strong> {template.subject}
              </p>
            )}
            {template.type === 'email' ? (
              <div className="rounded border bg-background">
                <iframe
                  title="email-preview"
                  sandbox="allow-same-origin"
                  className="w-full h-40"
                  srcDoc={formatEmailPreview(template.content)}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <strong>{t('forms.content')}:</strong> {template.content}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSendTest} 
            disabled={isLoading || (template.type === 'email' ? !formData.email : !formData.phone)}
          >
            {isLoading 
              ? t('common.loading') 
              : template.type === 'email' 
                ? t('testMessage.sendTestEmail') 
                : template.type === 'sms' 
                  ? t('testMessage.sendTestSms') 
                  : t('testMessage.sendTestWhatsapp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}