import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Filter, 
  Mail, 
  Phone, 
  Globe, 
  RotateCcw, 
  MapPin, 
  Church, 
  Shield,
  ChevronDown,
  ChevronUp 
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export interface EnhancedChurchFilters {
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  countries?: string[];
  denominations?: string[];
  verified?: boolean;
}

interface EnhancedChurchFiltersProps {
  filters: EnhancedChurchFilters
  onFiltersChange: (filters: EnhancedChurchFilters) => void
  className?: string
  showStats?: boolean
}

export function EnhancedChurchFilters({ 
  filters, 
  onFiltersChange, 
  className = "",
  showStats = false
}: EnhancedChurchFiltersProps) {
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableDenominations, setAvailableDenominations] = useState<string[]>([])
  const [countryStatsOpen, setCountryStatsOpen] = useState(false)
  const [denominationStatsOpen, setDenominationStatsOpen] = useState(false)
  const [contactStatsOpen, setContactStatsOpen] = useState(true)

  useEffect(() => {
    fetchAvailableOptions()
  }, [])

  const fetchAvailableOptions = async () => {
    try {
      // Fetch unique countries
      const { data: countries } = await supabase
        .from('churches')
        .select('country')
        .not('country', 'is', null)
      
      // Fetch unique denominations
      const { data: denominations } = await supabase
        .from('churches')
        .select('denomination')
        .not('denomination', 'is', null)

      const uniqueCountries = [...new Set(countries?.map(c => c.country) || [])]
        .filter(Boolean)
        .sort()
      
      const uniqueDenominations = [...new Set(denominations?.map(d => d.denomination) || [])]
        .filter(Boolean)
        .sort()

      setAvailableCountries(uniqueCountries)
      setAvailableDenominations(uniqueDenominations)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const handleCountryToggle = (country: string) => {
    const currentCountries = filters.countries || []
    const newCountries = currentCountries.includes(country)
      ? currentCountries.filter(c => c !== country)
      : [...currentCountries, country]
    
    onFiltersChange({
      ...filters,
      countries: newCountries.length > 0 ? newCountries : undefined
    })
  }

  const handleDenominationToggle = (denomination: string) => {
    const currentDenominations = filters.denominations || []
    const newDenominations = currentDenominations.includes(denomination)
      ? currentDenominations.filter(d => d !== denomination)
      : [...currentDenominations, denomination]
    
    onFiltersChange({
      ...filters,
      denominations: newDenominations.length > 0 ? newDenominations : undefined
    })
  }

  const handleReset = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value === true
  )

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.hasEmail) count++
    if (filters.hasPhone) count++
    if (filters.hasWebsite) count++
    if (filters.verified) count++
    if (filters.countries?.length) count++
    if (filters.denominations?.length) count++
    return count
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {getActiveFiltersCount()} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Contact Information */}
      <Collapsible open={contactStatsOpen} onOpenChange={setContactStatsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Contact Information</span>
            </div>
            {contactStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasEmail"
              checked={filters.hasEmail || false}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  hasEmail: checked === true ? true : undefined
                })
              }
            />
            <Label htmlFor="hasEmail" className="flex items-center gap-2 cursor-pointer text-sm">
              <Mail className="h-3 w-3" />
              Has Email Address
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPhone"
              checked={filters.hasPhone || false}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  hasPhone: checked === true ? true : undefined
                })
              }
            />
            <Label htmlFor="hasPhone" className="flex items-center gap-2 cursor-pointer text-sm">
              <Phone className="h-3 w-3" />
              Has Phone Number
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasWebsite"
              checked={filters.hasWebsite || false}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  hasWebsite: checked === true ? true : undefined
                })
              }
            />
            <Label htmlFor="hasWebsite" className="flex items-center gap-2 cursor-pointer text-sm">
              <Globe className="h-3 w-3" />
              Has Website
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.verified || false}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  verified: checked === true ? true : undefined
                })
              }
            />
            <Label htmlFor="verified" className="flex items-center gap-2 cursor-pointer text-sm">
              <Shield className="h-3 w-3" />
              Verified Churches Only
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Countries */}
      <Collapsible open={countryStatsOpen} onOpenChange={setCountryStatsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Countries</span>
              {filters.countries?.length && (
                <Badge variant="secondary" className="text-xs">
                  {filters.countries.length}
                </Badge>
              )}
            </div>
            {countryStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {availableCountries.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={`country-${country}`}
                    checked={filters.countries?.includes(country) || false}
                    onCheckedChange={() => handleCountryToggle(country)}
                  />
                  <Label 
                    htmlFor={`country-${country}`} 
                    className="cursor-pointer text-sm flex-1"
                  >
                    {country}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Denominations */}
      <Collapsible open={denominationStatsOpen} onOpenChange={setDenominationStatsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Church className="h-4 w-4" />
              <span className="text-sm font-medium">Denominations</span>
              {filters.denominations?.length && (
                <Badge variant="secondary" className="text-xs">
                  {filters.denominations.length}
                </Badge>
              )}
            </div>
            {denominationStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {availableDenominations.map((denomination) => (
                <div key={denomination} className="flex items-center space-x-2">
                  <Checkbox
                    id={`denomination-${denomination}`}
                    checked={filters.denominations?.includes(denomination) || false}
                    onCheckedChange={() => handleDenominationToggle(denomination)}
                  />
                  <Label 
                    htmlFor={`denomination-${denomination}`} 
                    className="cursor-pointer text-sm flex-1"
                  >
                    {denomination}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}