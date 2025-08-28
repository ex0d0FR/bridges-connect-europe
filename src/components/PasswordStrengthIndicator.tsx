import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const criteria: StrengthCriteria[] = [
    {
      label: "At least 8 characters",
      test: (pwd) => pwd.length >= 8,
      met: password.length >= 8,
    },
    {
      label: "Contains uppercase letter",
      test: (pwd) => /[A-Z]/.test(pwd),
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter", 
      test: (pwd) => /[a-z]/.test(pwd),
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      test: (pwd) => /\d/.test(pwd),
      met: /\d/.test(password),
    },
    {
      label: "Contains special character",
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
  ];

  const metCriteria = criteria.filter(c => c.met).length;
  const strengthPercentage = (metCriteria / criteria.length) * 100;
  
  const getStrengthLevel = () => {
    if (strengthPercentage < 40) return { label: "Weak", color: "text-destructive" };
    if (strengthPercentage < 70) return { label: "Fair", color: "text-yellow-600" };
    if (strengthPercentage < 90) return { label: "Good", color: "text-blue-600" };
    return { label: "Strong", color: "text-green-600" };
  };

  const strength = getStrengthLevel();
  const isPasswordValid = metCriteria >= 4; // Require at least 4 out of 5 criteria

  if (!password) return null;

  return (
    <div className={cn("space-y-2 text-sm", className)}>
      {/* Strength indicator bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-300",
              strengthPercentage < 40 && "bg-destructive",
              strengthPercentage >= 40 && strengthPercentage < 70 && "bg-yellow-500",
              strengthPercentage >= 70 && strengthPercentage < 90 && "bg-blue-500",
              strengthPercentage >= 90 && "bg-green-500"
            )}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
        <span className={cn("font-medium", strength.color)}>
          {strength.label}
        </span>
      </div>

      {/* Security warning for weak passwords */}
      {strengthPercentage < 70 && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Security Notice</p>
            <p className="text-xs">Weak passwords are vulnerable to attacks. Consider using a stronger password.</p>
          </div>
        </div>
      )}

      {/* Criteria checklist */}
      <div className="space-y-1">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {criterion.met ? (
              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn(
              criterion.met ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
            )}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>

      {/* Additional security tips */}
      {isPasswordValid && (
        <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 p-2 rounded-md border border-green-200 dark:border-green-800">
          ✓ Your password meets security requirements
        </div>
      )}
    </div>
  );
};

// Validation function for use in forms
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  // Require at least 4 out of 5 criteria (special chars are optional but recommended)
  const criteriamet = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  ].filter(Boolean).length;
  
  if (criteriamet < 4) {
    errors.push("Password must meet at least 4 security criteria");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};