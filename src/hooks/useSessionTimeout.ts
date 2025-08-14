import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
}

interface SessionTimeoutState {
  isActive: boolean;
  timeRemaining: number;
  showWarning: boolean;
  resetTimer: () => void;
  extendSession: () => void;
}

export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout
}: UseSessionTimeoutOptions = {}): SessionTimeoutState => {
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);
  const [showWarning, setShowWarning] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setTimeRemaining(timeoutMinutes * 60);
    setShowWarning(false);
    setIsActive(true);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      toast({
        title: "Session Warning",
        description: `Your session will expire in ${warningMinutes} minutes due to inactivity`,
        variant: "default",
      });
    }, (timeoutMinutes - warningMinutes) * 60 * 1000);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      onTimeout?.();
    }, timeoutMinutes * 60 * 1000);

    // Start countdown interval
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsActive(false);
          onTimeout?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, [timeoutMinutes, warningMinutes, onTimeout, toast]);

  const extendSession = useCallback(() => {
    resetTimer();
    toast({
      title: "Session Extended",
      description: "Your session has been extended",
      variant: "default",
    });
  }, [resetTimer, toast]);

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (isActive) {
      resetTimer();
    }
  }, [isActive, resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const throttledHandler = throttle(handleActivity, 1000);

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Initial timer setup
    resetTimer();

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleActivity, resetTimer]);

  return {
    isActive,
    timeRemaining,
    showWarning,
    resetTimer,
    extendSession
  };
};

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}