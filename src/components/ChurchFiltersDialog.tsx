import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Filter, Mail, Phone, Globe, RotateCcw } from "lucide-react"

export interface ChurchFilters {
  hasEmail?: boolean
  hasPhone?: boolean
  hasWebsite?: boolean
}

interface ChurchFiltersDialogProps {
  filters: ChurchFilters
  onFiltersChange: (filters: ChurchFilters) => void
  trigger?: React.ReactNode
}

export function ChurchFiltersDialog({ 
  filters, 
  onFiltersChange, 
  trigger 
}: ChurchFiltersDialogProps) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<ChurchFilters>(filters)

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters = {}
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value === true)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={hasActiveFilters ? "border-primary" : ""}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-2 h-2" />
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Churches</DialogTitle>
          <DialogDescription>
            Filter churches by available contact information and details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmail"
                  checked={localFilters.hasEmail || false}
                  onCheckedChange={(checked) =>
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      hasEmail: checked === true ? true : undefined 
                    }))
                  }
                />
                <Label htmlFor="hasEmail" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Has Email Address
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPhone"
                  checked={localFilters.hasPhone || false}
                  onCheckedChange={(checked) =>
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      hasPhone: checked === true ? true : undefined 
                    }))
                  }
                />
                <Label htmlFor="hasPhone" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  Has Phone Number
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Online Presence</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWebsite"
                  checked={localFilters.hasWebsite || false}
                  onCheckedChange={(checked) =>
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      hasWebsite: checked === true ? true : undefined 
                    }))
                  }
                />
                <Label htmlFor="hasWebsite" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4" />
                  Has Website
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}