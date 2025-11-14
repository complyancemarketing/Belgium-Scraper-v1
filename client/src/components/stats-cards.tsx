import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock } from "lucide-react";
import type { ScrapingSession } from "@shared/schema";

interface StatsCardsProps {
  session?: ScrapingSession;
  isLoading: boolean;
}

export function StatsCards({ session, isLoading }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Pages Crawled",
      value: session?.totalPagesCrawled ?? 0,
      icon: FileText,
      testId: "stat-total-crawled",
    },
    {
      title: "E-Invoicing Pages Found",
      value: session?.eInvoicingPagesFound ?? 0,
      icon: CheckCircle,
      testId: "stat-einvoicing-found",
    },
    {
      title: "Last Scrape",
      value: session?.completedAt 
        ? new Date(session.completedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : 'Never',
      icon: Clock,
      testId: "stat-last-scrape",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6 hover-elevate" data-testid={stat.testId}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`${stat.testId}-value`}>
                  {stat.value}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-md">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
