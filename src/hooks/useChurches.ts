import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useChurches = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['churches', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('churches')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%`);
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
      const { data, error } = await supabase
        .from('churches')
        .insert([churchData])
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