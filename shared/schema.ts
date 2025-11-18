import { z } from "zod";

export const scrapedPageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  content: z.string(),
  scrapedAt: z.string(),
});

export const scrapingSessionSchema = z.object({
  id: z.string(),
  status: z.enum(['idle', 'scraping', 'completed', 'stopped', 'error']),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  totalPagesCrawled: z.number(),
  eInvoicingPagesFound: z.number(),
  duplicatesIgnored: z.number(),
  maxPages: z.number().optional(), // Optional to allow unlimited crawling
  currentUrl: z.string().optional(), // Current URL being crawled
  errorMessage: z.string().optional(),
});

export const insertScrapedPageSchema = scrapedPageSchema.omit({ id: true });
export const insertScrapingSessionSchema = scrapingSessionSchema.omit({ id: true });

export const appSettingsSchema = z.object({
  autoRunEnabled: z.boolean(),
  teamsWebhookUrl: z.string().nullable().optional(),
  lastAutoRunAt: z.string().nullable().optional(),
  lastManualRunAt: z.string().nullable().optional(),
  cloudEnabled: z.boolean().optional(),
});

export const scraperStatsSchema = z.object({
  totalPages: z.number(),
  einvoicingPages: z.number(),
  lastScrapeAt: z.string().nullable().optional(),
});

export type ScrapedPage = z.infer<typeof scrapedPageSchema>;
export type InsertScrapedPage = z.infer<typeof insertScrapedPageSchema>;
export type ScrapingSession = z.infer<typeof scrapingSessionSchema>;
export type InsertScrapingSession = z.infer<typeof insertScrapingSessionSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type ScraperStats = z.infer<typeof scraperStatsSchema>;
