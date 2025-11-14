import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScrapedPage } from "@shared/schema";

interface ResultsTableProps {
  pages: ScrapedPage[];
}

export function ResultsTable({ pages }: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPages = pages.filter((page) => {
    const query = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(query) ||
      page.url.toLowerCase().includes(query) ||
      page.content.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPages = filteredPages.slice(startIndex, endIndex);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="p-6" data-testid="card-results-table">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground" data-testid="text-results-title">
            E-Invoicing Pages Found
          </h2>
          <Badge variant="secondary" data-testid="badge-results-count">
            {filteredPages.length} results
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, URL, or content..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[30%]">
                  Page Title
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[30%]">
                  URL
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[30%]">
                  Content Preview
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[10%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                currentPages.map((page, index) => (
                  <TableRow 
                    key={page.id} 
                    className="hover-elevate"
                    data-testid={`row-page-${index}`}
                  >
                    <TableCell className="font-medium text-sm" data-testid={`text-title-${index}`}>
                      {truncateText(page.title, 60)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-muted-foreground break-all" data-testid={`text-url-${index}`}>
                        {truncateText(page.url, 50)}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-content-${index}`}>
                      {truncateText(page.content, 80)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        data-testid={`button-view-${index}`}
                      >
                        <a href={page.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPages.length)} of {filteredPages.length} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
