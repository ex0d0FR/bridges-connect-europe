// Input validation and sanitization utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  // Allow international phone numbers with optional + prefix
  const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;
  return phoneRegex.test(phone.trim());
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeText = (text: string): string => {
  // Basic XSS prevention - strip HTML tags and escape special characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[char];
    });
};

export const formatPhoneNumber = (phone: string): string => {
  // Normalize phone number format
  const cleaned = phone.replace(/\D/g, '');
  if (!phone.startsWith('+') && cleaned.length > 0) {
    return `+${cleaned}`;
  }
  return phone;
};