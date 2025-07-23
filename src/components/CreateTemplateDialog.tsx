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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('templates.createTemplate')}</DialogTitle>
          <DialogDescription>
            Create a new message template for your campaigns
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter template name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message_type">Message Type</Label>
            <Select value={formData.message_type} onValueChange={(value) => setFormData({ ...formData, message_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter your message template content..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}