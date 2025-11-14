import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

type SortField = 'title' | 'url' | 'scrapedAt';
type SortDirection = 'asc' | 'desc';

export function ResultsTable({ pages }: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('scrapedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedPages = useMemo(() => {
    let filtered = pages.filter((page) => {
      const query = searchQuery.toLowerCase();
      return (
        page.title.toLowerCase().includes(query) ||
        page.url.toLowerCase().includes(query) ||
        page.content.toLowerCase().includes(query)
      );
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'url') {
        comparison = a.url.localeCompare(b.url);
      } else if (sortField === 'scrapedAt') {
        comparison = new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [pages, searchQuery, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPages = filteredAndSortedPages.slice(startIndex, endIndex);

  const allCurrentSelected = currentPages.length > 0 && currentPages.every(p => selectedIds.has(p.id));
  const someCurrentSelected = currentPages.some(p => selectedIds.has(p.id)) && !allCurrentSelected;

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      const newSelected = new Set(selectedIds);
      currentPages.forEach(p => newSelected.delete(p.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      currentPages.forEach(p => newSelected.add(p.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
      : <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
  };

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
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Badge variant="outline" data-testid="badge-selected-count">
                {selectedIds.size} selected
              </Badge>
            )}
            <Badge variant="secondary" data-testid="badge-results-count">
              {filteredAndSortedPages.length} results
            </Badge>
          </div>
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
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allCurrentSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                    className={someCurrentSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[25%]">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center hover-elevate px-2 py-1 rounded-md -ml-2"
                    data-testid="button-sort-title"
                  >
                    Page Title
                    <SortIcon field="title" />
                  </button>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[30%]">
                  <button
                    onClick={() => handleSort('url')}
                    className="flex items-center hover-elevate px-2 py-1 rounded-md -ml-2"
                    data-testid="button-sort-url"
                  >
                    URL
                    <SortIcon field="url" />
                  </button>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[25%]">
                  Content Preview
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[10%]">
                  <button
                    onClick={() => handleSort('scrapedAt')}
                    className="flex items-center hover-elevate px-2 py-1 rounded-md -ml-2"
                    data-testid="button-sort-date"
                  >
                    Date
                    <SortIcon field="scrapedAt" />
                  </button>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide w-[10%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(page.id)}
                        onCheckedChange={() => toggleSelect(page.id)}
                        aria-label={`Select ${page.title}`}
                        data-testid={`checkbox-select-${index}`}
                      />
                    </TableCell>
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
                    <TableCell className="text-xs text-muted-foreground" data-testid={`text-date-${index}`}>
                      {new Date(page.scrapedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedPages.length)} of {filteredAndSortedPages.length} results
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
