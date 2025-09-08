import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" 
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useChurches, Church, ChurchFilters } from "@/hooks/useChurches"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Users, Mail, Phone, Globe, MapPin, CheckSquare } from "lucide-react"
import { EnhancedChurchFilters } from "./EnhancedChurchFilters"

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
  const [filters, setFilters] = useState<ChurchFilters>({})
  const { toast } = useToast()
  const { data: churches = [], isLoading: churchesLoading } = useChurches(searchTerm, filters)

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

  const handleSelectAll = () => {
    const allChurchIds = churches.map(church => church.id)
    setSelectedChurches(allChurchIds)
  }

  const handleDeselectAll = () => {
    setSelectedChurches([])
  }

  const handleSelectWithEmail = () => {
    const churchesWithEmail = churches
      .filter(church => church.email && church.email.trim() !== '')
      .map(church => church.id)
    setSelectedChurches(prev => [...new Set([...prev, ...churchesWithEmail])])
  }

  const handleSelectWithPhone = () => {
    const churchesWithPhone = churches
      .filter(church => church.phone && church.phone.trim() !== '')
      .map(church => church.id)
    setSelectedChurches(prev => [...new Set([...prev, ...churchesWithPhone])])
  }

  const filteredChurches = churches

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Churches - {campaignName}
          </DialogTitle>
          <DialogDescription>
            Select churches to include in this campaign. Use filters to narrow down your selection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1 space-y-4">
            <EnhancedChurchFilters
              filters={filters}
              onFiltersChange={setFilters}
              className="border rounded-lg p-4"
            />
            
            {/* Quick Actions */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Quick Select
              </h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={handleSelectAll}
                  disabled={churches.length === 0}
                >
                  Select All ({churches.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={handleDeselectAll}
                  disabled={selectedChurches.length === 0}
                >
                  Deselect All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={handleSelectWithEmail}
                  disabled={churches.filter(c => c.email).length === 0}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  With Email ({churches.filter(c => c.email).length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={handleSelectWithPhone}
                  disabled={churches.filter(c => c.phone).length === 0}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  With Phone ({churches.filter(c => c.phone).length})
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Church List */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Search and Stats */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search churches by name, city, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {churches.length} available
                </Badge>
                <Badge variant="default" className="text-xs">
                  {selectedChurches.length} selected
                </Badge>
              </div>
            </div>

            {/* Churches List */}
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-4">
                {churchesLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    Loading churches...
                  </div>
                ) : filteredChurches.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-medium mb-2">No churches found</div>
                    <p className="text-sm">
                      Try adjusting your search terms or filters to find more churches.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredChurches.map((church) => (
                      <div key={church.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <Checkbox
                          checked={selectedChurches.includes(church.id)}
                          onCheckedChange={() => handleChurchToggle(church.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-base">{church.name}</h4>
                            <div className="flex items-center gap-1">
                              {church.email && <Mail className="h-3 w-3 text-green-600" />}
                              {church.phone && <Phone className="h-3 w-3 text-blue-600" />}
                              {church.website && <Globe className="h-3 w-3 text-purple-600" />}
                              {church.verified && (
                                <Badge variant="secondary" className="text-xs ml-2">Verified</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            {church.contact_name && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Contact: {church.contact_name}
                              </div>
                            )}
                            {church.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {church.email}
                              </div>
                            )}
                            {church.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {church.phone}
                              </div>
                            )}
                            {church.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {church.city}, {church.country}
                              </div>
                            )}
                            {church.denomination && (
                              <div className="col-span-full">
                                <Badge variant="outline" className="text-xs">
                                  {church.denomination}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || selectedChurches.length === 0}>
            {isLoading ? "Saving..." : `Save Changes (${selectedChurches.length} selected)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}