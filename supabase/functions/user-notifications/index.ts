import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'registration' | 'approval' | 'rejection';
  userId: string;
  adminEmails?: string[];
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { type, userId, adminEmails, rejectionReason }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for user ${userId}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Handle different notification types
    switch (type) {
      case 'registration':
        // Notify admins of new registration
        if (adminEmails && adminEmails.length > 0) {
          console.log(`Notifying ${adminEmails.length} admins of new registration`);
          // In a real implementation, you would send emails here
          // For now, we'll just log the notification
          console.log(`New user registration: ${profile.email} (${profile.full_name})`);
        }
        break;

      case 'approval':
        // Notify user of approval
        console.log(`User ${profile.email} has been approved`);
        // In a real implementation, you would send an approval email here
        break;

      case 'rejection':
        // Notify user of rejection
        console.log(`User ${profile.email} has been rejected. Reason: ${rejectionReason}`);
        // In a real implementation, you would send a rejection email here
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} notification processed successfully` 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in user-notifications function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);