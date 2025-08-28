// Content Security Policy and XSS Prevention utilities

/**
 * Sanitizes HTML content to prevent XSS attacks
 * This is a safer alternative to dangerouslySetInnerHTML
 */
export const sanitizeHtmlContent = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove potentially dangerous elements and attributes
  return html
    // Remove script tags and their content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove potentially dangerous HTML tags
    .replace(/<(iframe|object|embed|form|input|textarea|select|option|button|link|meta|base|style)[^>]*>/gi, '')
    // Clean up remaining tags (basic allowlist)
    .replace(/<(?!\/?(?:p|br|b|i|strong|em|u|ul|ol|li|h[1-6]|blockquote|a|img)\b)[^>]*>/gi, '')
    // Ensure href attributes are safe
    .replace(/href\s*=\s*["']?(?!https?:\/\/|\/)[^"'>\s]*["']?/gi, 'href="#"')
    // Ensure src attributes are safe (only allow https images)
    .replace(/src\s*=\s*["']?(?!https:\/\/)[^"'>\s]*["']?/gi, 'src=""');
};

/**
 * Validates and sanitizes URLs to prevent malicious redirects
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '#';
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '#';
    }
    
    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '#';
      }
      
      // Block private IP ranges
      if (hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
        return '#';
      }
      
      // Block file:// and other dangerous protocols
      if (hostname === '' || parsedUrl.protocol !== 'https:') {
        return '#';
      }
    }
    
    return parsedUrl.toString();
  } catch {
    return '#';
  }
};

/**
 * Sanitizes text content for display in HTML context
 */
export const sanitizeTextForHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates file upload to prevent malicious files
 */
export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // File size limit (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Allowed file types (restrictive allowlist)
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'text/csv',
    'application/pdf',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push('Invalid file name');
  }
  
  // Check for executable extensions (even if MIME type is different)
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.js', '.vbs', '.ps1'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (dangerousExtensions.includes(extension)) {
    errors.push('Potentially dangerous file extension');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Content Security Policy configuration for headers
 */
export const getContentSecurityPolicy = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://ovoldtknfdyvyypadnmf.supabase.co wss://ovoldtknfdyvyypadnmf.supabase.co",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

/**
 * Rate limiting for UI actions to prevent abuse
 */
export class UIRateLimiter {
  private actions: Map<string, number[]> = new Map();
  
  constructor(private maxActions: number = 10, private windowMs: number = 60000) {}
  
  checkLimit(actionKey: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.actions.has(actionKey)) {
      this.actions.set(actionKey, []);
    }
    
    const actionTimes = this.actions.get(actionKey)!;
    // Remove old actions outside the window
    const recentActions = actionTimes.filter(time => time > windowStart);
    
    if (recentActions.length >= this.maxActions) {
      return false;
    }
    
    recentActions.push(now);
    this.actions.set(actionKey, recentActions);
    return true;
  }
}

// Global rate limiter instance for UI actions
export const uiRateLimiter = new UIRateLimiter();