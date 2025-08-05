import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Mail, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { useChurchEmailScraping, type ScrapingResult, type EmailUpdate } from '@/hooks/useChurchEmailScraping';
import { Church } from '@/hooks/useChurches';

interface ChurchEmailScrapingDialogProps {
  churches: Church[];
  trigger?: React.ReactNode;
}

export const ChurchEmailScrapingDialog: React.FC<ChurchEmailScrapingDialogProps> = ({
  churches,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState<Map<string, EmailUpdate>>(new Map());
  
  const {
    startScraping,
    applyEmailUpdates,
    clearResults,
    isScrapingInProgress,
    scrapingProgress,
    isApplyingUpdates
  } = useChurchEmailScraping();

  // Filter churches without emails that have websites
  const eligibleChurches = churches.filter(church => 
    !church.email && church.website
  );

  const handleStartScraping = () => {
    if (eligibleChurches.length === 0) return;
    
    const churchIds = eligibleChurches.map(church => church.id);
    startScraping.mutate(churchIds);
  };

  const handleEmailSelection = (churchId: string, email: string) => {
    setSelectedUpdates(prev => {
      const updated = new Map(prev);
      updated.set(churchId, {
        churchId,
        selectedEmail: email,
        updateNotes: true
      });
      return updated;
    });
  };

  const handleToggleSelection = (churchId: string, isSelected: boolean) => {
    setSelectedUpdates(prev => {
      const updated = new Map(prev);
      if (isSelected && scrapingProgress) {
        const result = scrapingProgress.results.find(r => r.churchId === churchId);
        if (result && result.foundEmails.length > 0) {
          updated.set(churchId, {
            churchId,
            selectedEmail: result.foundEmails[0],
            updateNotes: true
          });
        }
      } else {
        updated.delete(churchId);
      }
      return updated;
    });
  };

  const handleApplyUpdates = () => {
    const updates = Array.from(selectedUpdates.values());
    if (updates.length > 0) {
      applyEmailUpdates.mutate(updates);
    }
  };

  const getStatusIcon = (status: ScrapingResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'no_emails_found':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: ScrapingResult['status']) => {
    switch (status) {
      case 'success':
        return 'Found';
      case 'failed':
        return 'Failed';
      case 'no_emails_found':
        return 'No emails';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Scrape Emails
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Church Email Scraping
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scraping Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Eligible Churches</div>
                  <div className="text-2xl font-bold">{eligibleChurches.length}</div>
                </div>
                {scrapingProgress && (
                  <>
                    <div>
                      <div className="font-medium text-muted-foreground">Processed</div>
                      <div className="text-2xl font-bold">{scrapingProgress.processed}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Found Emails</div>
                      <div className="text-2xl font-bold text-green-600">{scrapingProgress.succeeded}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{scrapingProgress.failed}</div>
                    </div>
                  </>
                )}
              </div>

              {scrapingProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{scrapingProgress.processed} of {scrapingProgress.total}</span>
                  </div>
                  <Progress 
                    value={(scrapingProgress.processed / scrapingProgress.total) * 100} 
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {!scrapingProgress && (
                  <Button 
                    onClick={handleStartScraping}
                    disabled={isScrapingInProgress || eligibleChurches.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isScrapingInProgress ? 'Scraping...' : 'Start Email Scraping'}
                  </Button>
                )}

                {scrapingProgress && (
                  <>
                    <Button 
                      onClick={handleApplyUpdates}
                      disabled={selectedUpdates.size === 0 || isApplyingUpdates}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isApplyingUpdates ? 'Updating...' : `Apply ${selectedUpdates.size} Updates`}
                    </Button>
                    <Button variant="outline" onClick={clearResults}>
                      Clear Results
                    </Button>
                  </>
                )}
              </div>

              {eligibleChurches.length === 0 && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  No churches eligible for email scraping. Churches need to have a website but no existing email address.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {scrapingProgress && scrapingProgress.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scraping Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {scrapingProgress.results.map((result) => (
                      <div key={result.churchId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.foundEmails.length > 0 && (
                              <Checkbox
                                checked={selectedUpdates.has(result.churchId)}
                                onCheckedChange={(checked) => 
                                  handleToggleSelection(result.churchId, checked as boolean)
                                }
                              />
                            )}
                            <div>
                              <div className="font-medium">{result.churchName}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getStatusIcon(result.status)}
                                {getStatusText(result.status)}
                                {result.error && (
                                  <span className="text-red-500">- {result.error}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                            {result.foundEmails.length} emails
                          </Badge>
                        </div>

                        {result.foundEmails.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Found Emails:</div>
                            {result.foundEmails.length === 1 ? (
                              <div className="text-sm bg-muted p-2 rounded">
                                {result.foundEmails[0]}
                              </div>
                            ) : (
                              <Select
                                value={selectedUpdates.get(result.churchId)?.selectedEmail || result.foundEmails[0]}
                                onValueChange={(email) => handleEmailSelection(result.churchId, email)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select email to use" />
                                </SelectTrigger>
                                <SelectContent>
                                  {result.foundEmails.map((email) => (
                                    <SelectItem key={email} value={email}>
                                      {email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};