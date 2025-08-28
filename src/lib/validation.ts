// Enhanced input validation and sanitization utilities with security hardening

// Enhanced email validation with additional security checks
export const validateEmailSecurity = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }
  
  // Length validation (RFC limit)
  if (trimmedEmail.length > 254) {
    errors.push('Email address too long');
  }
  
  // Check for suspicious patterns
  if (trimmedEmail.includes('..')) {
    errors.push('Invalid email format: consecutive dots not allowed');
  }
  
  // Check for potential injection attempts
  if (/[<>'"\\]/.test(trimmedEmail)) {
    errors.push('Email contains invalid characters');
  }
  
  // Check for common disposable email patterns
  const disposableDomains = ['tempmail', 'guerrillamail', '10minutemail', 'mailinator'];
  const domain = trimmedEmail.split('@')[1];
  if (domain && disposableDomains.some(d => domain.includes(d))) {
    errors.push('Disposable email addresses are not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254; // RFC limit
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  // Allow international phone numbers with optional + prefix
  const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;
  return phoneRegex.test(phone.trim());
};

export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Enhanced XSS prevention - strip HTML tags and escape special characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>&"'`]/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
      };
      return escapeMap[char];
    })
    .trim();
};

export const validateRequiredString = (value: string, fieldName: string): string | null => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateStringLength = (value: string, min: number, max: number, fieldName: string): string | null => {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (value.length > max) {
    return `${fieldName} must be less than ${max} characters`;
  }
  return null;
};

export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') return '';
  
  // Remove path traversal attempts and dangerous characters
  return fileName
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '')
    .trim();
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Normalize phone number format
  const cleaned = phone.replace(/\D/g, '');
  if (!phone.startsWith('+') && cleaned.length > 0) {
    return `+${cleaned}`;
  }
  return phone;
};

export const validateJsonInput = (input: any): boolean => {
  try {
    if (typeof input === 'string') {
      JSON.parse(input);
    }
    return true;
  } catch {
    return false;
  }
};

// Rate limiting helper for client-side
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    return true;
  };
};