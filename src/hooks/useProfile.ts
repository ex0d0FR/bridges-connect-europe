import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useSecurityLogging } from '@/hooks/useSecurityLogging';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type AppRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  status: UserStatus;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by?: string;
  assigned_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });
};

export const useUserRoles = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useIsAdmin = () => {
  const roles = useUserRoles();
  return roles.data?.some(role => role.role === 'admin') ?? false;
};

// Admin hooks for managing users
export const useAllProfiles = () => {
  const isAdmin = useIsAdmin();
  
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { logAdminAction } = useSecurityLogging();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      status, 
      rejectionReason 
    }: { 
      userId: string; 
      status: UserStatus; 
      rejectionReason?: string;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status,
          rejection_reason: rejectionReason,
          approved_by: status === 'approved' ? (await supabase.auth.getUser()).data.user?.id : null,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate user sessions if blocking/suspending
      if (status === 'suspended') {
        const currentUser = await supabase.auth.getUser();
        if (currentUser.data.user?.id) {
          await supabase.rpc('invalidate_user_sessions_enhanced', {
            _user_id: userId,
            _admin_id: currentUser.data.user.id,
            _reason: 'user_suspended'
          });
        }
      }
      
      // Log admin action for security monitoring
      logAdminAction(`user_status_change_${status}`, userId, {
        old_status: 'unknown',
        new_status: status,
        rejection_reason: rejectionReason,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      toast({
        title: "User status updated successfully",
        description: "The user's approval status has been changed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { logAdminAction } = useSecurityLogging();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user?.id) {
        throw new Error('Not authenticated');
      }
      
      // Use the safe delete function
      const { data, error } = await supabase.rpc('delete_user_safely', {
        _user_id: userId,
        _admin_id: currentUser.data.user.id
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      toast({
        title: "User deleted successfully",
        description: "The user account has been permanently removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useGetUserActivity = (userId: string) => {
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_activity_summary', {
        _user_id: userId
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};