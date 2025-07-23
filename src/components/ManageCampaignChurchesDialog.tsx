import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useChurches, Church } from "@/hooks/useChurches"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"

interface ManageCampaignChurchesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  campaignName: string
  onUpdate: () => void
}

export function ManageCampaignChurchesDialog({ 
  open, 
  onOpenChange, 
  campaignId, 
  campaignName,
  onUpdate 
}: ManageCampaignChurchesDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChurches, setSelectedChurches] = useState<string[]>([])
  const [campaignChurches, setCampaignChurches] = useState<string[]>([])
  const { toast } = useToast()
  const { data: churches = [], isLoading: churchesLoading } = useChurches(searchTerm)

  useEffect(() => {
    if (open) {
      fetchCampaignChurches()
    }
  }, [open, campaignId])

  const fetchCampaignChurches = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_churches')
        .select('church_id')
        .eq('campaign_id', campaignId)

      if (error) throw error
      
      const churchIds = data.map(item => item.church_id)
      setCampaignChurches(churchIds)
      setSelectedChurches(churchIds)
    } catch (error) {
      console.error('Error fetching campaign churches:', error)
    }
  }

  const handleChurchToggle = (churchId: string) => {
    setSelectedChurches(prev => 
      prev.includes(churchId) 
        ? prev.filter(id => id !== churchId)
        : [...prev, churchId]
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Remove churches that are no longer selected
      const churchesToRemove = campaignChurches.filter(id => !selectedChurches.includes(id))
      if (churchesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('campaign_churches')
          .delete()
          .eq('campaign_id', campaignId)
          .in('church_id', churchesToRemove)
        
        if (deleteError) throw deleteError
      }

      // Add newly selected churches
      const churchesToAdd = selectedChurches.filter(id => !campaignChurches.includes(id))
      if (churchesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('campaign_churches')
          .insert(
            churchesToAdd.map(churchId => ({
              campaign_id: campaignId,
              church_id: churchId
            }))
          )
        
        if (insertError) throw insertError
      }

      toast({
        title: "Success",
        description: `${selectedChurches.length} churches assigned to campaign`,
      })

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating campaign churches:', error)
      toast({
        title: "Error",
        description: "Failed to update campaign churches",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredChurches = churches.filter(church => 
    church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Churches - {campaignName}
          </DialogTitle>
          <DialogDescription>
            Select churches to include in this campaign
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search churches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Badge variant="secondary">
              {selectedChurches.length} selected
            </Badge>
          </div>

          <ScrollArea className="h-[400px] border rounded-md p-4">
            {churchesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading churches...
              </div>
            ) : filteredChurches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No churches found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChurches.map((church) => (
                  <div key={church.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={selectedChurches.includes(church.id)}
                      onCheckedChange={() => handleChurchToggle(church.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{church.name}</h4>
                        {church.verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {church.contact_name && (
                          <p>Contact: {church.contact_name}</p>
                        )}
                        {church.email && (
                          <p>Email: {church.email}</p>
                        )}
                        {church.phone && (
                          <p>Phone: {church.phone}</p>
                        )}
                        {church.city && (
                          <p>Location: {church.city}, {church.country}</p>
                        )}
                        {church.denomination && (
                          <p>Denomination: {church.denomination}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}