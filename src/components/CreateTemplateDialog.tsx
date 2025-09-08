import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useLanguage } from "@/contexts/LanguageContext"
import { RichTextEditor } from "./RichTextEditor"
import { TemplatePreview } from "./TemplatePreview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateCreated: () => void
}

export function CreateTemplateDialog({ open, onOpenChange, onTemplateCreated }: CreateTemplateDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    message_type: "",
    language: "en"
  })
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Please sign in to create templates")
      }

      const { error } = await supabase
        .from('templates')
        .insert([
          {
            name: formData.name,
            content: formData.content,
            type: formData.message_type as 'email' | 'sms' | 'whatsapp',
            language: formData.language,
            created_by: user.id
          }
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Template created successfully",
      })

      setFormData({ name: "", content: "", message_type: "", language: "en" })
      onTemplateCreated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('templates.createTemplate')}</DialogTitle>
          <DialogDescription>
            Create a new message template for your campaigns with rich formatting and live preview
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Left Column - Form */}
          <div className="space-y-6 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter a descriptive template name"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="message_type">Message Type</Label>
                      <Select value={formData.message_type} onValueChange={(value) => setFormData({ ...formData, message_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">📧 Email</SelectItem>
                          <SelectItem value="sms">💬 SMS</SelectItem>
                          <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={formData.message_type === 'email' ? 'rich' : 'simple'} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="rich" disabled={formData.message_type !== 'email'}>
                        Rich Editor
                      </TabsTrigger>
                      <TabsTrigger value="simple">Simple Text</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="rich" className="mt-4">
                      {formData.message_type === 'email' ? (
                        <RichTextEditor
                          content={formData.content}
                          onChange={(content) => setFormData({ ...formData, content })}
                          placeholder="Create your email template with rich formatting..."
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground p-4 border rounded-md bg-muted">
                          Rich editor is only available for email templates. Switch to Simple Text for SMS and WhatsApp.
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="simple" className="mt-4">
                      <div className="space-y-2">
                        <Textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder={
                            formData.message_type === 'sms' 
                              ? "Enter your SMS message (160 characters recommended)..."
                              : formData.message_type === 'whatsapp'
                              ? "Enter your WhatsApp message..."
                              : "Enter your message content..."
                          }
                          rows={6}
                          className="resize-none"
                          required
                        />
                        {formData.message_type === 'sms' && (
                          <p className="text-xs text-muted-foreground">
                            Characters: {formData.content.length}/160
                            {formData.content.length > 160 && (
                              <span className="text-destructive ml-2">
                                (~{Math.ceil(formData.content.length / 160)} messages)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !formData.message_type || !formData.content.trim()}>
                  {isLoading ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </div>

          {/* Right Column - Preview */}
          <div className="border-l pl-6 overflow-hidden">
            <TemplatePreview
              name={formData.name}
              content={formData.content}
              messageType={formData.message_type}
              language={formData.language}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}