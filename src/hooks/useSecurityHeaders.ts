import { useEffect } from 'react';
import { getContentSecurityPolicy } from '@/lib/contentSecurity';

/**
 * Hook to set security headers for the application
 * Note: This sets meta tags for CSP, but ideally CSP should be set by the server
 */
export const useSecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy via meta tag (fallback method)
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = getContentSecurityPolicy();
      document.head.appendChild(cspMeta);
    }

    // Set X-Content-Type-Options
    const xContentType = document.createElement('meta');
    xContentType.httpEquiv = 'X-Content-Type-Options';
    xContentType.content = 'nosniff';
    document.head.appendChild(xContentType);

    // Note: X-Frame-Options set to SAMEORIGIN for Lovable compatibility
    // DENY would break iframe functionality in development environment
    const xFrameOptions = document.createElement('meta');
    xFrameOptions.httpEquiv = 'X-Frame-Options';
    xFrameOptions.content = 'SAMEORIGIN';
    document.head.appendChild(xFrameOptions);

    // Set Referrer Policy
    const referrerPolicy = document.createElement('meta');
    referrerPolicy.name = 'referrer';
    referrerPolicy.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerPolicy);

    // Set viewport for mobile security
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
      document.head.appendChild(viewportMeta);
    }

    // Cleanup function to remove added meta tags
    return () => {
      document.head.removeChild(xContentType);
      document.head.removeChild(xFrameOptions);
      document.head.removeChild(referrerPolicy);
    };
  }, []);
};