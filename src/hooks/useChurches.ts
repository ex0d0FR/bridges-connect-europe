import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecurityAuditing } from '@/hooks/useSecurityAuditing';
import { sanitizeText } from '@/lib/validation';

export interface Church {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  contact_name?: string;
  country: string;
  address?: string;
  city?: string;
  postal_code?: string;
  denomination?: string;
  size_category?: string;
  notes?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateChurchData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  contact_name?: string;
  country: string;
  address?: string;
  city?: string;
  postal_code?: string;
  denomination?: string;
  size_category?: string;
  notes?: string;
}

export interface ChurchFilters {
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  countries?: string[];
  denominations?: string[];
  verified?: boolean;
}

export const useChurches = (searchTerm?: string, filters?: ChurchFilters) => {
  return useQuery({
    queryKey: ['churches', searchTerm, filters],
    queryFn: async () => {
      let query = supabase
        .from('churches')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,denomination.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters?.hasEmail) {
        query = query.not('email', 'is', null).neq('email', '');
      }
      
      if (filters?.hasPhone) {
        query = query.not('phone', 'is', null).neq('phone', '');
      }
      
      if (filters?.hasWebsite) {
        query = query.not('website', 'is', null).neq('website', '');
      }

      if (filters?.countries && filters.countries.length > 0) {
        query = query.in('country', filters.countries);
      }

      if (filters?.denominations && filters.denominations.length > 0) {
        query = query.in('denomination', filters.denominations);
      }

      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Church[];
    },
  });
};

export const useCreateChurch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (churchData: CreateChurchData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add churches');
      }

      const { data, error } = await supabase
        .from('churches')
        .insert([{ ...churchData, created_by: user.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      toast({
        title: "Success",
        description: "Church added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add church",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateChurch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...churchData }: Partial<Church> & { id: string }) => {
      const { data, error } = await supabase
        .from('churches')
        .update(churchData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No church found or you do not have permission to update this church');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      toast({
        title: "Success",
        description: "Church updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update church",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteChurch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('churches')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      toast({
        title: "Success",
        description: "Church deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete church",
        variant: "destructive",
      });
    },
  });
};