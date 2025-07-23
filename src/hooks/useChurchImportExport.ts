import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCreateChurch } from '@/hooks/useChurches';
import type { CreateChurchData, Church } from '@/hooks/useChurches';

export const useChurchImportExport = () => {
  const { toast } = useToast();
  const createChurch = useCreateChurch();

  const exportToCSV = useCallback((churches: Church[]) => {
    if (!churches || churches.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no churches to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Website',
      'Facebook',
      'Instagram',
      'Contact Name',
      'Country',
      'Address',
      'City',
      'Postal Code',
      'Denomination',
      'Size Category',
      'Notes',
      'Verified'
    ];

    const csvData = churches.map(church => [
      church.name,
      church.email || '',
      church.phone || '',
      church.website || '',
      church.facebook || '',
      church.instagram || '',
      church.contact_name || '',
      church.country,
      church.address || '',
      church.city || '',
      church.postal_code || '',
      church.denomination || '',
      church.size_category || '',
      church.notes || '',
      church.verified ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `churches_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${churches.length} churches to CSV file.`,
    });
  }, [toast]);

  const importFromCSV = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        // Validate headers
        const requiredHeaders = ['Name', 'Country'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            title: "Invalid CSV format",
            description: `Missing required columns: ${missingHeaders.join(', ')}`,
            variant: "destructive",
          });
          return;
        }

        const churches: CreateChurchData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          
          if (values.length < headers.length) continue;
          
          const church: CreateChurchData = {
            name: values[headers.indexOf('Name')] || '',
            country: values[headers.indexOf('Country')] || 'France',
            email: values[headers.indexOf('Email')] || undefined,
            phone: values[headers.indexOf('Phone')] || undefined,
            website: values[headers.indexOf('Website')] || undefined,
            facebook: values[headers.indexOf('Facebook')] || undefined,
            instagram: values[headers.indexOf('Instagram')] || undefined,
            contact_name: values[headers.indexOf('Contact Name')] || undefined,
            address: values[headers.indexOf('Address')] || undefined,
            city: values[headers.indexOf('City')] || undefined,
            postal_code: values[headers.indexOf('Postal Code')] || undefined,
            denomination: values[headers.indexOf('Denomination')] || undefined,
            size_category: values[headers.indexOf('Size Category')] || undefined,
            notes: values[headers.indexOf('Notes')] || undefined,
          };
          
          if (church.name && church.country) {
            churches.push(church);
          }
        }

        if (churches.length === 0) {
          toast({
            title: "No valid data found",
            description: "No valid church records found in the CSV file.",
            variant: "destructive",
          });
          return;
        }

        // Import churches one by one
        let successCount = 0;
        let errorCount = 0;
        
        const importNext = (index: number) => {
          if (index >= churches.length) {
            toast({
              title: "Import completed",
              description: `Successfully imported ${successCount} churches. ${errorCount} failed.`,
            });
            return;
          }
          
          createChurch.mutate(churches[index], {
            onSuccess: () => {
              successCount++;
              importNext(index + 1);
            },
            onError: () => {
              errorCount++;
              importNext(index + 1);
            }
          });
        };
        
        importNext(0);
        
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  }, [createChurch, toast]);

  const downloadTemplate = useCallback(() => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Website',
      'Facebook',
      'Instagram',
      'Contact Name',
      'Country',
      'Address',
      'City',
      'Postal Code',
      'Denomination',
      'Size Category',
      'Notes'
    ];

    const sampleData = [
      'Sample Church',
      'contact@samplechurch.com',
      '+1234567890',
      'https://samplechurch.com',
      'https://facebook.com/samplechurch',
      'https://instagram.com/samplechurch',
      'John Doe',
      'France',
      '123 Church Street',
      'Paris',
      '75001',
      'Protestant',
      'Medium',
      'Sample notes about the church'
    ];

    const csvContent = [headers, sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'churches_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template downloaded",
      description: "CSV template file downloaded successfully.",
    });
  }, [toast]);

  return {
    exportToCSV,
    importFromCSV,
    downloadTemplate,
  };
};