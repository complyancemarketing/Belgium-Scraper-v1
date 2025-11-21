import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  Search, 
  Calendar, 
  FileText,
  Globe,
  Filter
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ScrapedPage, AppSettings } from "@shared/schema";

interface CountryPage extends ScrapedPage {
  country: string;
  countryCode: string;
}

const COUNTRIES = [
  { code: "belgium", name: "Belgium", flag: "🇧🇪", available: true },
  { code: "uae", name: "UAE", flag: "🇦🇪", available: true },
  { code: "germany", name: "Germany", flag: "🇩🇪", available: false },
];

export default function Home() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [teamsWebhookInput, setTeamsWebhookInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch Belgium pages
  const { data: belgiumPages = [] } = useQuery<ScrapedPage[]>({
    queryKey: ['/api/pages'],
    refetchInterval: 30000,
  });

  // Fetch UAE pages
  const { data: uaePages = [] } = useQuery<ScrapedPage[]>({
    queryKey: ['/api/uae/pages'],
    refetchInterval: 30000,
  });

  // Fetch settings for Teams webhook
  const { data: settings, isLoading: settingsLoading } = useQuery<AppSettings>({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<AppSettings>) =>
      apiRequest('POST', '/api/settings', payload).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Teams webhook URL has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save webhook URL.",
        variant: "destructive",
      });
    },
  });

  const handleSaveTeamsWebhook = () => {
    updateSettingsMutation.mutate({
      teamsWebhookUrl: teamsWebhookInput.trim() ? teamsWebhookInput.trim() : null,
    });
  };

  // Combine all country pages
  const allPages: CountryPage[] = [
    ...belgiumPages.map(page => ({
      ...page,
      country: "Belgium",
      countryCode: "belgium"
    })),
    ...uaePages.map(page => ({
      ...page,
      country: "UAE",
      countryCode: "uae"
    }))
  ];

  // Filter by date
  const getDateFilteredPages = (pages: CountryPage[]) => {
    if (dateFilter === "all") return pages;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (dateFilter === "7days") {
      filterDate.setDate(now.getDate() - 7);
    } else if (dateFilter === "30days") {
      filterDate.setDate(now.getDate() - 30);
    }
    
    return pages.filter(page => new Date(page.scrapedAt) >= filterDate);
  };

  // Filter and sort pages
  const filteredPages = getDateFilteredPages(allPages)
    .filter(page => {
      // Country filter
      if (countryFilter !== "all" && page.countryCode !== countryFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery === "") return true;
      
      return (
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.matchedKeyword?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());

  // Pagination
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Global E-Invoicing Monitor
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Track e-invoicing updates across multiple countries in real-time
          </p>
        </header>

        {/* Country Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {COUNTRIES.map((country) => (
            <Card 
              key={country.code}
              className={`transition-all hover:shadow-lg ${!country.available && 'opacity-60'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{country.flag}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{country.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {country.available ? 'Active' : 'Coming Soon'}
                      </p>
                    </div>
                  </div>
                  {country.available && (
                    <Badge variant="default">Live</Badge>
                  )}
                </div>
                {country.available ? (
                  <Link href={`/${country.code}`}>
                    <Button className="w-full" variant="default">
                      View Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Teams Webhook Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Teams Channel Webhook</span>
              {settings?.teamsWebhookUrl && (
                <Badge variant="secondary">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="teams-webhook">Webhook URL</Label>
              <Input
                id="teams-webhook"
                type="url"
                placeholder="https://complyance1.webhook.office.com/webhookb2/..."
                value={teamsWebhookInput || settings?.teamsWebhookUrl || ""}
                onChange={(event) => setTeamsWebhookInput(event.target.value)}
                disabled={settingsLoading || updateSettingsMutation.isPending}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveTeamsWebhook}
                disabled={settingsLoading || updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Webhook"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sends a notification to your Teams channel whenever new e-invoicing pages are detected across all countries.
            </p>
          </CardContent>
        </Card>

        {/* Search and Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent E-Invoicing Updates
            </CardTitle>
            
            {/* Search Bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, content, or URL..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="flex-1">
                <Label htmlFor="date-filter" className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date Range
                </Label>
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="country-filter" className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Country
                </Label>
                <Select value={countryFilter} onValueChange={handleCountryFilterChange}>
                  <SelectTrigger id="country-filter">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="belgium">🇧🇪 Belgium</SelectItem>
                    <SelectItem value="uae">🇦🇪 UAE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No updates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || dateFilter !== "all" || countryFilter !== "all"
                    ? "Try adjusting your filters or search terms" 
                    : "Start monitoring countries to see e-invoicing updates"
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedPages.map((page) => (
                    <div
                      key={page.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="shrink-0">
                              {page.country}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(page.scrapedAt)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                            {page.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {page.summary || page.content}
                          </p>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {page.url.length > 60 ? page.url.substring(0, 60) + '...' : page.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredPages.length)} of {filteredPages.length} results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-9"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
