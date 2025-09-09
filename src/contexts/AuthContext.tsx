import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useSecurityLogging } from '@/hooks/useSecurityLogging';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStatus: string | null;
  isApproved: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  
  const { logAuthAttempt, logSuspiciousActivity } = useSecurityLogging();

  const signOut = useCallback(async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
    setUserStatus(null);
    setIsApproved(false);
  }, []);

  // Check user status and approval
  const checkUserStatus = useCallback(async () => {
    if (!user?.id) {
      setUserStatus(null);
      setIsApproved(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        logSuspiciousActivity('profile_fetch_error', { error: error.message });
        return;
      }

      const newStatus = profile?.status || 'pending';
      const newIsApproved = newStatus === 'approved';

      // If user was approved but now isn't, log and sign out
      if (isApproved && !newIsApproved) {
        console.log('User approval status revoked, signing out');
        logSuspiciousActivity('approval_revoked', { 
          old_status: userStatus, 
          new_status: newStatus 
        });
        await signOut();
        return;
      }

      setUserStatus(newStatus);
      setIsApproved(newIsApproved);
    } catch (error) {
      console.error('Error checking user status:', error);
      logSuspiciousActivity('status_check_error', { error: error.message });
    }
  }, [user?.id, isApproved, userStatus, signOut, logSuspiciousActivity]);

  // Session timeout integration
  useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onTimeout: signOut,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log auth events for security monitoring
        if (event === 'SIGNED_IN' && session?.user) {
          logAuthAttempt(true, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          setUserStatus(null);
          setIsApproved(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [logAuthAttempt]);

  // Monitor user status changes in real-time
  useEffect(() => {
    if (user?.id) {
      // Check status immediately when user is set
      checkUserStatus();
      
      // Set up real-time subscription for profile changes
      const profileSubscription = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Profile updated in real-time:', payload);
            setTimeout(() => {
              checkUserStatus();
            }, 0);
          }
        )
        .subscribe();

      return () => {
        profileSubscription.unsubscribe();
      };
    }
  }, [user?.id, checkUserStatus]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logAuthAttempt(false, email, error.message);
      }
      
      return { error };
    } catch (error) {
      logAuthAttempt(false, email, error.message);
      return { error };
    }
  };


  const value = {
    user,
    session,
    loading,
    userStatus,
    isApproved,
    signUp,
    signIn,
    signOut,
    checkUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};