import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { StatsCards } from "@/components/stats-cards";
import { ResultsTable } from "@/components/results-table";
import { EmptyState } from "@/components/empty-state";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { exportToExcel } from "@/lib/excel-export";
import type { ScrapedPage, ScrapingSession } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery<ScrapingSession>({
    queryKey: ['/api/session'],
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'scraping' ? 1000 : false;
    },
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery<ScrapedPage[]>({
    queryKey: ['/api/pages'],
    refetchInterval: session?.status === 'scraping' ? 2000 : false,
  });

  const startScrapingMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/scrape/start', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Scraping Started",
        description: "The web scraper is now crawling the website for e-invoicing content.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start scraping. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportToExcel = async () => {
    if (pages.length === 0) {
      toast({
        title: "No Data",
        description: "There are no pages to export. Start scraping first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportToExcel(pages);
      toast({
        title: "Export Successful",
        description: `Exported ${pages.length} pages to Excel file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data to Excel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isScraping = session?.status === 'scraping';
  const hasPages = pages.length > 0;
  const progressPercentage = session?.totalPagesCrawled && session?.maxPages
    ? Math.min((session.totalPagesCrawled / session.maxPages) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
                UAE Ministry of Finance - E-invoicing Content Scraper
              </h1>
              <p className="text-base text-muted-foreground" data-testid="text-page-subtitle">
                Automated web scraper to extract e-invoicing related pages from mof.gov.ae
              </p>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handleExportToExcel}
              disabled={!hasPages || isExporting}
              data-testid="button-export-excel"
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </header>

        <StatsCards session={session} isLoading={sessionLoading} />

        <Card className="mb-6 p-6" data-testid="card-control-panel">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Target URL
              </label>
              <Input
                type="text"
                value="https://mof.gov.ae/en/home/"
                readOnly
                className="font-mono text-sm bg-muted cursor-default"
                data-testid="input-target-url"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button
                size="lg"
                onClick={() => startScrapingMutation.mutate()}
                disabled={isScraping || startScrapingMutation.isPending}
                data-testid="button-start-scraping"
                className="gap-2 min-w-[200px]"
              >
                {isScraping ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Start Scraping
                  </>
                )}
              </Button>

              {session && session.status !== 'idle' && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" data-testid="badge-pages-crawled">
                    {session.totalPagesCrawled} pages crawled
                  </Badge>
                  <Badge variant="default" data-testid="badge-einvoicing-found">
                    {session.eInvoicingPagesFound} e-invoicing pages
                  </Badge>
                  {session.duplicatesIgnored > 0 && (
                    <Badge variant="outline" data-testid="badge-duplicates-ignored">
                      {session.duplicatesIgnored} duplicates ignored
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {isScraping && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground" data-testid="text-progress-percentage">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" data-testid="progress-scraping" />
              </div>
            )}

            {session?.status === 'completed' && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                <p className="text-sm font-medium text-foreground" data-testid="text-completion-message">
                  ✓ Scraping completed successfully! Found {session.eInvoicingPagesFound} e-invoicing related pages.
                </p>
              </div>
            )}

            {session?.status === 'error' && session.errorMessage && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm font-medium text-destructive" data-testid="text-error-message">
                  Error: {session.errorMessage}
                </p>
              </div>
            )}
          </div>
        </Card>

        {pagesLoading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </Card>
        ) : hasPages ? (
          <ResultsTable pages={pages} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
