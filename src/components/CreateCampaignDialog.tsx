import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useLanguage } from "@/contexts/LanguageContext"

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCampaignCreated: () => void
}

interface Template {
  id: string
  name: string
  type: string
}

export function CreateCampaignDialog({ open, onOpenChange, onCampaignCreated }: CreateCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [formData, setFormData] = useState({
    name: "",
    template_id: "",
    message_type: ""
  })
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('templates')
        .select('id, name, type')
        .eq('created_by', user.id)

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from('campaigns')
        .insert([
          {
            name: formData.name,
            description: `Campaign using ${selectedTemplate?.name} template`,
            created_by: user.id,
            status: 'draft'
          }
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Campaign created successfully",
      })

      setFormData({ name: "", template_id: "", message_type: "" })
      onCampaignCreated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === formData.template_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a new outreach campaign using your templates
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter campaign name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select 
              value={formData.template_id} 
              onValueChange={(value) => {
                const template = templates.find(t => t.id === value)
                setFormData({ 
                  ...formData, 
                  template_id: value,
                  message_type: template?.type || ""
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Message Type: <span className="font-medium capitalize">{selectedTemplate.type}</span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.template_id}>
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}