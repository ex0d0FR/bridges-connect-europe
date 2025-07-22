import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChurchDiscoveryRequest {
  location: string;
  radius?: number;
  denomination?: string;
  country?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, radius = 5000, denomination, country = 'France' }: ChurchDiscoveryRequest = await req.json();
    
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // First, geocode the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleMapsApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
      throw new Error('Unable to geocode location');
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Search for churches nearby
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=church&key=${googleMapsApiKey}`;
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK') {
      throw new Error('Error searching for churches');
    }

    // Process and format church data
    const churches = placesData.results.map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      place_id: place.place_id,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      }
    }));

    console.log(`Found ${churches.length} churches near ${location}`);

    return new Response(JSON.stringify({ churches, total: churches.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in church-discovery function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);