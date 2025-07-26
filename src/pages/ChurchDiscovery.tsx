import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCreateChurch } from "@/hooks/useChurches";
import { Search, MapPin, Globe, Phone, Mail, Plus, Loader2, User, Star, Facebook, Instagram, Twitter } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiscoveredChurch {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_name?: string;
  denomination?: string;
  source: string;
  confidence_score?: number;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  additional_info?: {
    description?: string;
    services?: string[];
    languages?: string[];
  };
}

export default function ChurchDiscovery() {
  const [location, setLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredChurches, setDiscoveredChurches] = useState<DiscoveredChurch[]>([]);
  const [progress, setProgress] = useState(0);
  const [selectedChurches, setSelectedChurches] = useState<Set<number>>(new Set());
  const [filterCatholic, setFilterCatholic] = useState(true);
  const [enhancedDiscovery, setEnhancedDiscovery] = useState(true);
  const { toast } = useToast();
  const createChurch = useCreateChurch();
  const { t } = useLanguage();

  const handleScan = async () => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for churches.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setDiscoveredChurches([]);
    setSelectedChurches(new Set());

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('church-discovery', {
        body: { 
          location,
          filterNonCatholic: filterCatholic,
          enableEnhancedDiscovery: enhancedDiscovery
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      if (data?.churches) {
        setDiscoveredChurches(data.churches);
        toast({
          title: "Churches Discovered",
          description: `Found ${data.churches.length} ${filterCatholic ? 'non-Catholic ' : ''}churches in ${location}`,
        });
      } else {
        toast({
          title: "No Churches Found",
          description: "No churches were found in the specified location.",
        });
      }
    } catch (error: any) {
      console.error('Error discovering churches:', error);
      toast({
        title: "Discovery Failed",
        description: error.message || "Failed to discover churches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  const toggleChurchSelection = (index: number) => {
    const newSelected = new Set(selectedChurches);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChurches(newSelected);
  };

  const selectAllChurches = () => {
    const allIndices = new Set(discoveredChurches.map((_, index) => index));
    setSelectedChurches(allIndices);
  };

  const saveSelectedChurches = async () => {
    if (selectedChurches.size === 0) {
      toast({
        title: "No Churches Selected",
        description: "Please select at least one church to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      const churchesToSave = Array.from(selectedChurches).map(index => {
        const church = discoveredChurches[index];
        return {
          name: church.name,
          email: church.email,
          phone: church.phone,
          website: church.website,
          contact_name: church.contact_name || '',
          country: church.country || 'France',
          address: church.address,
          city: church.city,
          denomination: church.denomination,
          notes: `Discovered via ${church.source}${church.confidence_score ? ` (Confidence: ${church.confidence_score}%)` : ''}`,
        };
      });

      for (const churchData of churchesToSave) {
        await createChurch.mutateAsync(churchData);
      }

      toast({
        title: "Churches Saved",
        description: `Successfully saved ${churchesToSave.length} churches to your database.`,
      });
      setSelectedChurches(new Set());
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save churches. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t('discovery.title')}</h1>
        <p className="text-muted-foreground">
          {t('discovery.searchInstructions')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('discovery.searchForChurches')}
          </CardTitle>
          <CardDescription>
            {t('discovery.searchInstructions')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('discovery.location')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isScanning}
              className="flex-1"
            />
            <Button 
              onClick={handleScan} 
              disabled={isScanning || !location.trim()}
              className="flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('discovery.searching')}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {t('discovery.searchButton')}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="filter-catholic"
                checked={filterCatholic}
                onCheckedChange={setFilterCatholic}
                disabled={isScanning}
              />
              <Label htmlFor="filter-catholic" className="text-sm">
                Exclude Catholic churches from results
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enhanced-discovery"
                checked={enhancedDiscovery}
                onCheckedChange={setEnhancedDiscovery}
                disabled={isScanning}
              />
              <Label htmlFor="enhanced-discovery" className="text-sm">
                Enhanced discovery (website scraping for contact info)
              </Label>
            </div>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning multiple sources...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {discoveredChurches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('discovery.results')}</CardTitle>
                <CardDescription>
                  {discoveredChurches.length} {t('discovery.churchesFound')} • {selectedChurches.size} {t('discovery.selected')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={selectAllChurches}
                  variant="outline"
                  disabled={discoveredChurches.length === 0 || selectedChurches.size === discoveredChurches.length}
                  className="flex items-center gap-2"
                >
                  {t('discovery.selectAll')}
                </Button>
                <Button 
                  onClick={saveSelectedChurches}
                  disabled={selectedChurches.size === 0 || createChurch.isPending}
                  className="flex items-center gap-2"
                >
                  {createChurch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t('discovery.saveSelected')} ({selectedChurches.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {discoveredChurches.map((church, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-colors ${
                    selectedChurches.has(index) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleChurchSelection(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{church.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {church.source}
                          </Badge>
                          {church.denomination && (
                            <Badge variant="outline" className="text-xs">
                              {church.denomination}
                            </Badge>
                          )}
                          {church.confidence_score !== undefined && (
                            <Badge 
                              variant={church.confidence_score > 70 ? "default" : church.confidence_score > 50 ? "secondary" : "destructive"} 
                              className="text-xs flex items-center gap-1"
                            >
                              <Star className="h-2 w-2" />
                              {church.confidence_score}%
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid gap-1 text-sm text-muted-foreground">
                          {church.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{church.address}</span>
                            </div>
                          )}
                          {church.contact_name && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>{church.contact_name}</span>
                            </div>
                          )}
                          {church.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{church.phone}</span>
                            </div>
                          )}
                          {church.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{church.email}</span>
                            </div>
                          )}
                          {church.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <span className="truncate">{church.website}</span>
                            </div>
                          )}
                          {church.social_media && (
                            <div className="flex items-center gap-3 mt-1">
                              {church.social_media.facebook && (
                                <a 
                                  href={church.social_media.facebook} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Facebook className="h-3 w-3" />
                                  <span className="text-xs">Facebook</span>
                                </a>
                              )}
                              {church.social_media.instagram && (
                                <a 
                                  href={church.social_media.instagram} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-pink-600 hover:text-pink-800"
                                >
                                  <Instagram className="h-3 w-3" />
                                  <span className="text-xs">Instagram</span>
                                </a>
                              )}
                              {church.social_media.twitter && (
                                <a 
                                  href={church.social_media.twitter} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-blue-400 hover:text-blue-600"
                                >
                                  <Twitter className="h-3 w-3" />
                                  <span className="text-xs">Twitter</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`rounded-full w-4 h-4 border-2 ${
                        selectedChurches.has(index)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedChurches.has(index) && (
                          <div className="w-full h-full rounded-full bg-background scale-50"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}