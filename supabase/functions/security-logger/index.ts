import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map for basic protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Basic rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimit = rateLimitMap.get(clientIP);
    
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded' }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        rateLimit.count++;
      } else {
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Check authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer ')) {
      // Log unauthorized access attempt
      console.log('SECURITY_EVENT:', JSON.stringify({
        event_type: 'unauthorized_access_attempt',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        client_ip: clientIP,
        user_agent: req.headers.get('user-agent'),
        source: 'security-logger',
      }));
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const body = await req.json();
    const { timestamp, event_type, details, severity, session_id, user_id } = body;

    // Validate required fields
    if (!event_type || !severity || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_type, severity, timestamp' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Enhanced security event logging with additional metadata
    const securityEvent = {
      timestamp,
      event_type,
      severity,
      details: details || {},
      session_id,
      user_id,
      client_ip: clientIP,
      user_agent: req.headers.get('user-agent'),
      source: 'application',
      logged_at: new Date().toISOString(),
    };

    // Log security event with structured format
    console.log('SECURITY_EVENT:', JSON.stringify(securityEvent));

    // Alert on high/critical severity events
    if (severity === 'high' || severity === 'critical') {
      console.log('HIGH_PRIORITY_SECURITY_ALERT:', JSON.stringify({
        ...securityEvent,
        alert_level: 'immediate_attention_required',
      }));
    }

    // Clean up old rate limit entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now - RATE_LIMIT_WINDOW;
      for (const [ip, limit] of rateLimitMap.entries()) {
        if (limit.resetTime < cutoff) {
          rateLimitMap.delete(ip);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        logged_at: new Date().toISOString(),
        event_id: crypto.randomUUID(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in security-logger:', error);
    
    // Log the error as a security event
    console.log('SECURITY_EVENT:', JSON.stringify({
      event_type: 'logger_error',
      severity: 'high',
      timestamp: new Date().toISOString(),
      details: {
        error: error.message,
        stack: error.stack,
      },
      source: 'security-logger',
    }));

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);