import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCreateChurch } from "@/hooks/useChurches";
import { Search, MapPin, Globe, Phone, Mail, Plus, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DiscoveredChurch {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  denomination?: string;
  source: string;
}

export default function ChurchDiscovery() {
  const [location, setLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredChurches, setDiscoveredChurches] = useState<DiscoveredChurch[]>([]);
  const [progress, setProgress] = useState(0);
  const [selectedChurches, setSelectedChurches] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const createChurch = useCreateChurch();

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
          filterNonCatholic: true 
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      if (data?.churches) {
        setDiscoveredChurches(data.churches);
        toast({
          title: "Churches Discovered",
          description: `Found ${data.churches.length} non-Catholic churches in ${location}`,
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
          contact_name: '',
          country: church.country || 'France',
          address: church.address,
          city: church.city,
          denomination: church.denomination,
          notes: `Discovered via ${church.source}`,
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
        <h1 className="text-3xl font-bold">Discover Churches</h1>
        <p className="text-muted-foreground">
          Search for non-Catholic churches online and add them to your database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Church Discovery
          </CardTitle>
          <CardDescription>
            Enter a location to discover churches using multiple online sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter city, region, or country (e.g., Paris, France)"
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
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Discover
                </>
              )}
            </Button>
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
                <CardTitle>Discovered Churches</CardTitle>
                <CardDescription>
                  {discoveredChurches.length} churches found • {selectedChurches.size} selected
                </CardDescription>
              </div>
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
                Save Selected ({selectedChurches.size})
              </Button>
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{church.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {church.source}
                          </Badge>
                          {church.denomination && (
                            <Badge variant="outline" className="text-xs">
                              {church.denomination}
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