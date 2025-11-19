import { useState } from "react";
import type { ScrapedPage } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SummaryAccordionProps {
  pages: ScrapedPage[];
}

export function SummaryAccordion({ pages }: SummaryAccordionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const filteredPages = pages.filter(page =>
    searchQuery === "" ||
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No E-Invoicing Updates Yet</h3>
        <p className="text-muted-foreground">
          Start scraping to find e-invoicing related content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search updates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredPages.length} update{filteredPages.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Accordion List */}
      <Accordion type="single" collapsible className="w-full space-y-2">
        {filteredPages.map((page) => (
          <AccordionItem
            key={page.id}
            value={page.id}
            className="border rounded-lg px-4 bg-card hover:bg-accent/50 transition-colors"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-start gap-3 text-left flex-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {page.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(page.scrapedAt)}</span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2">
              <div className="space-y-3">
                {/* Summary */}
                {page.summary ? (
                  <div className="bg-muted/50 rounded-md p-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Summary
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {page.summary}
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-md p-4">
                    <p className="text-sm text-muted-foreground">
                      {page.content}
                    </p>
                  </div>
                )}

                {/* Matched Keyword */}
                {page.matchedKeyword && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Keyword matched:</span> {page.matchedKeyword}
                  </div>
                )}

                {/* Source Link */}
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline font-mono"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Source
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredPages.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      )}
    </div>
  );
}
