import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ExternalLink, 
  Search, 
  Calendar, 
  FileText,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ScrapedPage } from "@shared/schema";

interface CountryPage extends ScrapedPage {
  country: string;
  countryCode: string;
}

const COUNTRIES = [
  { code: "belgium", name: "Belgium", flag: "🇧🇪", available: true },
  { code: "uae", name: "UAE", flag: "🇦🇪", available: false },
  { code: "germany", name: "Germany", flag: "🇩🇪", available: false },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Belgium pages
  const { data: belgiumPages = [] } = useQuery<ScrapedPage[]>({
    queryKey: ['/api/pages'],
  });

  // Combine all country pages (for now just Belgium)
  const allPages: CountryPage[] = belgiumPages.map(page => ({
    ...page,
    country: "Belgium",
    countryCode: "belgium"
  }));

  // Filter and sort pages
  const filteredPages = allPages
    .filter(page => 
      searchQuery === "" || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());

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

        {/* Search and Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent E-Invoicing Updates
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, content, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredPages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No updates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Start scraping to see e-invoicing updates"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPages.map((page) => (
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
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {page.content}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
