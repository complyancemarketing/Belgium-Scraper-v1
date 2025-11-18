import { Card } from "@/components/ui/card";
import { FileSearch } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="p-12" data-testid="card-empty-state">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="mb-6 p-6 bg-muted/50 rounded-full">
          <FileSearch className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-empty-title">
          No E-Invoicing Pages Yet
        </h3>
        <p className="text-base text-muted-foreground mb-6" data-testid="text-empty-description">
          Click the "Start Scraping" button above to begin crawling the Belgium BOSA website for e-invoicing related content.
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4 w-full">
          <p className="text-sm text-muted-foreground">
            The scraper will automatically:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 text-left">
            <li>• Crawl all pages from the target website</li>
            <li>• Identify e-invoicing related content</li>
            <li>• Avoid revisiting duplicate pages</li>
            <li>• Extract and display relevant information</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
