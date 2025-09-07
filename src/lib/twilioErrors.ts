// Comprehensive Twilio SMS Error Code Mapping and Diagnostics

export interface TwilioErrorInfo {
  code: number;
  title: string;
  description: string;
  category: 'configuration' | 'permissions' | 'validation' | 'billing' | 'rate_limit' | 'network';
  severity: 'critical' | 'high' | 'medium' | 'low';
  solutions: string[];
  quickFix?: string;
}

export const TWILIO_ERROR_CODES: Record<number, TwilioErrorInfo> = {
  // Authentication & Configuration Errors
  20001: {
    code: 20001,
    title: 'Invalid credentials',
    description: 'Your Account SID or Auth Token is invalid',
    category: 'configuration',
    severity: 'critical',
    solutions: [
      'Verify your Twilio Account SID and Auth Token',
      'Check if credentials are properly set in your environment',
      'Ensure no extra spaces or characters in credentials'
    ],
    quickFix: 'Go to Settings → Messaging and update your Twilio credentials'
  },
  
  // Phone Number & Sender Errors
  21212: {
    code: 21212,
    title: 'Invalid "To" phone number',
    description: 'The phone number provided is not a valid mobile number',
    category: 'validation',
    severity: 'high',
    solutions: [
      'Use E.164 format (+1234567890)',
      'Ensure the number is a mobile phone (landlines cannot receive SMS)',
      'Check for typos in the phone number'
    ]
  },
  21211: {
    code: 21211,
    title: 'Invalid "To" phone number',
    description: 'The phone number is not a valid number',
    category: 'validation',
    severity: 'high',
    solutions: [
      'Use proper E.164 format (+countrycode + number)',
      'Remove spaces, dashes, or special characters',
      'Verify the country code is correct'
    ]
  },
  21614: {
    code: 21614,
    title: 'Invalid mobile number',
    description: 'SMS can only be sent to mobile phones, not landlines',
    category: 'validation',
    severity: 'medium',
    solutions: [
      'Verify the number belongs to a mobile carrier',
      'Try a different mobile number',
      'Check if the number has SMS capabilities'
    ]
  },
  21408: {
    code: 21408,
    title: 'Permission denied',
    description: 'You don\'t have permission to send from this number',
    category: 'permissions',
    severity: 'critical',
    solutions: [
      'Verify the phone number is purchased in your Twilio account',
      'Check SMS capabilities are enabled for this number',
      'Ensure you own the phone number or messaging service'
    ]
  },
  21659: {
    code: 21659,
    title: 'Invalid "From" phone number',
    description: 'The sender phone number is not valid or not owned by you',
    category: 'configuration',
    severity: 'critical',
    solutions: [
      'Purchase a phone number from Twilio',
      'Verify the number in your Twilio Console',
      'Use a Messaging Service SID instead',
      'Check if you\'re using sandbox credentials with a production number'
    ],
    quickFix: 'Purchase a Twilio phone number or use test credentials'
  },
  
  // Trial Account Limitations
  21606: {
    code: 21606,
    title: 'Trial account restriction',
    description: 'Trial accounts can only send to verified phone numbers',
    category: 'permissions',
    severity: 'high',
    solutions: [
      'Verify the destination number in Twilio Console',
      'Upgrade to a paid Twilio account',
      'Add the number to your verified caller list'
    ],
    quickFix: 'Add recipient to verified numbers in Twilio Console'
  },
  21608: {
    code: 21608,
    title: 'Trial account restriction',
    description: 'Trial accounts have limited messaging capabilities',
    category: 'permissions',
    severity: 'high',
    solutions: [
      'Upgrade to a paid Twilio account for full functionality',
      'Use verified phone numbers only',
      'Consider purchasing credits'
    ],
    quickFix: 'Upgrade your Twilio account to remove trial restrictions'
  },
  
  // Rate Limiting
  20429: {
    code: 20429,
    title: 'Too many requests',
    description: 'Rate limit exceeded',
    category: 'rate_limit',
    severity: 'medium',
    solutions: [
      'Implement rate limiting in your application',
      'Wait before retrying',
      'Consider using multiple phone numbers for higher throughput'
    ]
  },
  
  // Geographic & Regulatory
  21612: {
    code: 21612,
    title: 'Geographic restriction',
    description: 'Cannot send SMS to this destination',
    category: 'permissions',
    severity: 'high',
    solutions: [
      'Check if SMS is supported in the destination country',
      'Verify regulatory compliance requirements',
      'Consider alternative messaging channels'
    ]
  },
  
  // Billing & Credits
  20003: {
    code: 20003,
    title: 'Insufficient funds',
    description: 'Your account doesn\'t have enough balance',
    category: 'billing',
    severity: 'critical',
    solutions: [
      'Add funds to your Twilio account',
      'Check your current balance',
      'Set up auto-recharge to prevent interruptions'
    ],
    quickFix: 'Add credits to your Twilio account'
  }
};

// Common sandbox phone numbers used by Twilio
export const SANDBOX_NUMBERS = [
  '+15005550006', // US
  '+15557932346', // Magic number
  '+14155238886', // Magic number
  // Add more as needed
];

export function isSandboxNumber(phoneNumber?: string): boolean {
  if (!phoneNumber) return false;
  return SANDBOX_NUMBERS.some(sandbox => phoneNumber.includes(sandbox.replace('+', '')));
}

export function isTrialAccount(accountSid?: string): boolean {
  // Trial account SIDs start with 'AC' but live accounts do too
  // Better detection would require API call, but we can infer from common patterns
  return false; // Would need API call to determine accurately
}

export function getTwilioErrorInfo(error: any): TwilioErrorInfo | null {
  let errorCode: number;
  
  // Try to extract error code from various error formats
  if (typeof error === 'object') {
    errorCode = error.code || error.error_code || error.errorCode;
    
    // Try parsing from message if code not directly available
    if (!errorCode && error.message) {
      const match = error.message.match(/error (\d+)/i) || error.message.match(/code:?\s*(\d+)/i);
      if (match) {
        errorCode = parseInt(match[1]);
      }
    }
  }
  
  if (errorCode && TWILIO_ERROR_CODES[errorCode]) {
    return TWILIO_ERROR_CODES[errorCode];
  }
  
  return null;
}

export function formatTwilioError(error: any): {
  message: string;
  category: string;
  severity: string;
  solutions: string[];
  quickFix?: string;
} {
  const errorInfo = getTwilioErrorInfo(error);
  
  if (errorInfo) {
    return {
      message: `${errorInfo.title}: ${errorInfo.description}`,
      category: errorInfo.category,
      severity: errorInfo.severity,
      solutions: errorInfo.solutions,
      quickFix: errorInfo.quickFix
    };
  }
  
  // Fallback for unknown errors
  const message = typeof error === 'string' ? error : 
                 error?.message || error?.detail || 'Unknown error occurred';
  
  return {
    message,
    category: 'unknown',
    severity: 'medium',
    solutions: [
      'Check your Twilio configuration',
      'Verify phone number formats',
      'Review Twilio console for more details'
    ]
  };
}

export function getAccountDiagnostics(accountSid?: string, phoneNumber?: string) {
  return {
    isSandboxNumber: isSandboxNumber(phoneNumber),
    isTrialAccount: isTrialAccount(accountSid),
    hasLiveCredentials: !!(accountSid && accountSid.startsWith('AC')),
    phoneNumberType: isSandboxNumber(phoneNumber) ? 'sandbox' : 'production',
    credentialType: accountSid?.startsWith('AC') ? 'live' : 'test'
  };
}