import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, MessageSquare, Phone } from 'lucide-react'

interface TemplatePreviewProps {
  name: string
  content: string
  messageType: string
  language: string
}

export function TemplatePreview({ name, content, messageType, language }: TemplatePreviewProps) {
  const getIcon = () => {
    switch (messageType) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'whatsapp':
        return <Phone className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const renderEmailPreview = () => (
    <div className="bg-background border rounded-lg p-4 min-h-[300px]">
      <div className="border-b pb-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>From: your-church@example.com</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>To: member@example.com</span>
        </div>
        <div className="font-semibold mt-2">
          Subject: {name || 'Template Subject'}
        </div>
      </div>
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: content || '<p class="text-muted-foreground italic">Start typing to see your email preview...</p>' 
        }}
      />
    </div>
  )

  const renderSMSPreview = () => (
    <div className="bg-background border rounded-lg p-4 min-h-[300px]">
      <div className="flex justify-end mb-4">
        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">
          {content || 'Start typing to see your SMS preview...'}
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center">
        Character count: {content.length}/160
        {content.length > 160 && (
          <span className="text-destructive ml-2">
            (~{Math.ceil(content.length / 160)} messages)
          </span>
        )}
      </div>
    </div>
  )

  const renderWhatsAppPreview = () => (
    <div className="bg-[#e5ddd5] border rounded-lg p-4 min-h-[300px]">
      <div className="flex justify-end mb-4">
        <div className="bg-[#dcf8c6] rounded-lg px-3 py-2 max-w-[80%] relative">
          <div className="whitespace-pre-wrap">
            {content || 'Start typing to see your WhatsApp preview...'}
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">
            12:34 PM ✓✓
          </div>
        </div>
      </div>
    </div>
  )

  const renderPreview = () => {
    switch (messageType) {
      case 'email':
        return renderEmailPreview()
      case 'sms':
        return renderSMSPreview()
      case 'whatsapp':
        return renderWhatsAppPreview()
      default:
        return renderEmailPreview()
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          Live Preview
          <Badge variant="secondary" className="ml-auto">
            {language.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-4">
            {renderPreview()}
          </TabsContent>
          <TabsContent value="variables" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Variables:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Badge variant="outline">{'{{name}}'}</Badge>
                <Badge variant="outline">{'{{church_name}}'}</Badge>
                <Badge variant="outline">{'{{email}}'}</Badge>
                <Badge variant="outline">{'{{date}}'}</Badge>
                <Badge variant="outline">{'{{phone}}'}</Badge>
                <Badge variant="outline">{'{{address}}'}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click any variable to copy it to your clipboard
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}