import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Square, Send, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { StatsCards } from "@/components/stats-cards";
import { SummaryAccordion } from "@/components/summary-accordion";
import { EmptyState } from "@/components/empty-state";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { exportToExcel } from "@/lib/excel-export";
import { Link } from "wouter";
import type { AppSettings, ScrapedPage, ScrapingSession, ScraperStats } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const lastLoggedUrl = useRef<string | undefined>(undefined);
  const lastEInvoicingCount = useRef<number>(0);

  const { data: session, isLoading: sessionLoading } = useQuery<ScrapingSession>({
    queryKey: ['/api/session'],
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'scraping' ? 1000 : false;
    },
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<AppSettings>({
    queryKey: ['/api/settings'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ScraperStats>({
    queryKey: ['/api/stats'],
    refetchInterval: session?.status === 'scraping' ? 2000 : false,
  });

  // Log current URL to browser console when it changes
  useEffect(() => {
    // Log when scraping starts
    if (session?.status === 'scraping' && !lastLoggedUrl.current) {
      console.log('🚀 Scraping started...');
    }
    
    // Debug: log session data when scraping
    if (session?.status === 'scraping') {
      if (session.currentUrl && session.currentUrl !== lastLoggedUrl.current) {
        console.log(`🕷️ Crawling: ${session.currentUrl}`);
        lastLoggedUrl.current = session.currentUrl;
      } else if (!session.currentUrl && lastLoggedUrl.current) {
        // URL was cleared but we're still scraping - might be between pages
        console.log('⏳ Processing page...');
      }
    }
    
    // Log when e-invoicing pages are found
    if (session?.eInvoicingPagesFound && session.eInvoicingPagesFound > lastEInvoicingCount.current) {
      const newPages = session.eInvoicingPagesFound - lastEInvoicingCount.current;
      console.log(`✅ Found ${newPages} e-invoicing page(s)! Total: ${session.eInvoicingPagesFound}`);
      lastEInvoicingCount.current = session.eInvoicingPagesFound;
    }
    
    // Reset when scraping stops
    if (session?.status !== 'scraping') {
      if (lastLoggedUrl.current) {
        console.log('🛑 Scraping stopped');
      }
      lastLoggedUrl.current = undefined;
      lastEInvoicingCount.current = 0;
    }
  }, [session?.currentUrl, session?.status, session?.eInvoicingPagesFound]);

  const { data: pages = [], isLoading: pagesLoading } = useQuery<ScrapedPage[]>({
    queryKey: ['/api/pages'],
    refetchInterval: session?.status === 'scraping' ? 2000 : false,
  });

  const startScrapingMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/scrape/start', { onlyNew: true }),
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

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<AppSettings>) =>
      apiRequest('POST', '/api/settings', payload).then((res) => res.json()),
    onSuccess: (data: AppSettings) => {
      queryClient.setQueryData(['/api/settings'], data);
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopScrapingMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/scrape/stop', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session'] });
      toast({
        title: "Stopping Scraping",
        description: "The scraper will stop after processing the current page.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop scraping. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetDataMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/reset', {}).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/session'] });
      toast({
        title: "Data cleared",
        description: "All cached pages and stats have been reset.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendTeamsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/teams/send', {}).then((res) => res.json()),
    onSuccess: (data: { message: string }) => {
      toast({
        title: "Teams notification sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send Teams update",
        description: error.message || "Teams webhook call failed.",
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

  const handleToggleAutoRun = (checked: boolean) => {
    updateSettingsMutation.mutate({ autoRunEnabled: checked });
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      "This will erase all cached pages (including Firestore data) and reset stats. Continue?"
    );
    if (!confirmed) return;
    resetDataMutation.mutate();
  };

  const isScraping = session?.status === 'scraping';
  const hasPages = pages.length > 0;
  const progressPercentage = session?.totalPagesCrawled && session?.maxPages
    ? Math.min((session.totalPagesCrawled / session.maxPages) * 100, 100)
    : 0;
  const autoRunDisabled =
    settingsLoading ||
    updateSettingsMutation.isPending ||
    settings?.cloudEnabled === false;
  const resetDisabled = isScraping || resetDataMutation.isPending;
  const sendDisabled =
    isScraping ||
    sendTeamsMutation.isPending ||
    !settings?.teamsWebhookUrl ||
    settings?.teamsWebhookUrl.length === 0;
  const lastAutoRunDisplay = settings?.lastAutoRunAt
    ? new Date(settings.lastAutoRunAt).toLocaleString()
    : "Never";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
                Belgium BOSA - E-invoicing Content Scraper
              </h1>
              <p className="text-base text-muted-foreground" data-testid="text-page-subtitle">
                Automated web scraper to extract e-invoicing related pages from bosa.belgium.be
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

        <StatsCards stats={stats} isLoading={statsLoading} />

        <Card className="mb-6 p-6" data-testid="card-control-panel">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Target URL
              </label>
              <Input
                type="text"
                value="https://bosa.belgium.be/"
                readOnly
                className="font-mono text-sm bg-muted cursor-default"
                data-testid="input-target-url"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-3">
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
                
                {isScraping && (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => stopScrapingMutation.mutate()}
                    disabled={stopScrapingMutation.isPending}
                    data-testid="button-stop-scraping"
                    className="gap-2 min-w-[200px]"
                  >
                    <Square className="h-4 w-4" />
                    Stop Scraping
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleResetData}
                  disabled={resetDisabled}
                  data-testid="button-reset-data"
                >
                  {resetDataMutation.isPending ? "Resetting..." : "Reset Data"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => sendTeamsMutation.mutate()}
                  disabled={sendDisabled}
                  data-testid="button-send-teams"
                  className="gap-2"
                >
                  {sendTeamsMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send to Teams
                    </>
                  )}
                </Button>
              </div>

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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Auto-run nightly (10 PM IST)</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically crawl only new posts every evening.
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoRunEnabled ?? false}
                    onCheckedChange={handleToggleAutoRun}
                    disabled={autoRunDisabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Last auto-run: {lastAutoRunDisplay}
                </p>
                {settings?.cloudEnabled === false && (
                  <p className="text-xs text-destructive">
                    Connect Firebase to enable scheduling and persistence.
                  </p>
                )}
              </div>

            </div>

            {session?.status === 'completed' && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                <p className="text-sm font-medium text-foreground" data-testid="text-completion-message">
                  ✓ Scraping completed successfully! Found {session.eInvoicingPagesFound} e-invoicing related pages.
                </p>
              </div>
            )}

            {session?.status === 'stopped' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                <p className="text-sm font-medium text-foreground" data-testid="text-stopped-message">
                  ⚠ Scraping was stopped. Found {session.eInvoicingPagesFound} e-invoicing related pages before stopping.
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
          <SummaryAccordion pages={pages} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
