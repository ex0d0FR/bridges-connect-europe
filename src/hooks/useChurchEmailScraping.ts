import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScrapingResult {
  churchId: string;
  churchName: string;
  foundEmails: string[];
  status: 'success' | 'failed' | 'no_emails_found';
  error?: string;
}

export interface ScrapingProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: ScrapingResult[];
}

export interface EmailUpdate {
  churchId: string;
  selectedEmail: string;
  updateNotes: boolean;
}

export const useChurchEmailScraping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState<ScrapingProgress | null>(null);

  const startScraping = useMutation({
    mutationFn: async (churchIds: string[]) => {
      setIsScrapingInProgress(true);
      
      const { data, error } = await supabase.functions.invoke('church-email-scraper', {
        body: { 
          churchIds,
          batchSize: 10 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as ScrapingProgress;
    },
    onSuccess: (data) => {
      setScrapingProgress(data);
      setIsScrapingInProgress(false);
      
      toast({
        title: "Email Scraping Complete",
        description: `Found emails for ${data.succeeded} out of ${data.total} churches`,
      });
    },
    onError: (error: any) => {
      setIsScrapingInProgress(false);
      toast({
        title: "Error",
        description: error.message || "Failed to scrape emails",
        variant: "destructive",
      });
    },
  });

  const applyEmailUpdates = useMutation({
    mutationFn: async (updates: EmailUpdate[]) => {
      const updatePromises = updates.map(async (update) => {
        const updateData: any = { email: update.selectedEmail };
        
        if (update.updateNotes) {
          // Get current church data to append to notes
          const { data: church } = await supabase
            .from('churches')
            .select('notes')
            .eq('id', update.churchId)
            .single();
          
          const currentNotes = church?.notes || '';
          const scrapedEmailsNote = `\nScraped emails: ${update.selectedEmail}`;
          updateData.notes = currentNotes + scrapedEmailsNote;
        }
        
        return supabase
          .from('churches')
          .update(updateData)
          .eq('id', update.churchId);
      });

      const results = await Promise.allSettled(updatePromises);
      
      // Check for any failures
      const failures = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value.error)
      );
      
      if (failures.length > 0) {
        throw new Error(`Failed to update ${failures.length} churches`);
      }
      
      return results.length;
    },
    onSuccess: (updatedCount) => {
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      setScrapingProgress(null);
      
      toast({
        title: "Success",
        description: `Updated ${updatedCount} churches with new email addresses`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update churches",
        variant: "destructive",
      });
    },
  });

  const clearResults = () => {
    setScrapingProgress(null);
  };

  return {
    startScraping,
    applyEmailUpdates,
    clearResults,
    isScrapingInProgress,
    scrapingProgress,
    isApplyingUpdates: applyEmailUpdates.isPending,
  };
};