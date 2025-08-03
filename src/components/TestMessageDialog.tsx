import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Mail, MessageSquare, MessageCircle } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phone: ""
  })
  const { toast } = useToast()

  const handleSendTest = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let functionName: string
      let body: any

      if (template.type === 'email') {
        if (!formData.email) {
          throw new Error("Email address is required for email templates")
        }
        functionName = 'send-email'
        body = {
          to: formData.email,
          subject: template.subject || `Test: ${template.name}`,
          content: template.content,
          isTest: true
        }
      } else if (template.type === 'sms') {
        if (!formData.phone) {
          throw new Error("Phone number is required for SMS templates")
        }
        functionName = 'send-sms'
        body = {
          to: formData.phone,
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
        const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`
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

      const { data, error } = await supabase.functions.invoke(functionName, { 
        body,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Test message error:', error)
        throw error
      }

      console.log('Test message response:', data)

      toast({
        title: "Test message sent!",
        description: `${template.type.toUpperCase()} test message sent successfully`,
      })

      onOpenChange(false)
      setFormData({ email: "", phone: "" })
    } catch (error: any) {
      console.error('Error sending test message:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send test message",
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
            Test {template.type.toUpperCase()} Template
          </DialogTitle>
          <DialogDescription>
            Send a test message using the "{template.name}" template
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {template.type === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">Test Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
          )}
          
          {(template.type === 'sms' || template.type === 'whatsapp') && (
            <div className="space-y-2">
              <Label htmlFor="phone">Test Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                required
              />
            </div>
          )}

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Message Preview:</p>
            {template.subject && (
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Subject:</strong> {template.subject}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              <strong>Content:</strong> {template.content}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendTest} 
            disabled={isLoading || (template.type === 'email' ? !formData.email : !formData.phone)}
          >
            {isLoading ? "Sending..." : `Send Test ${template.type.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}