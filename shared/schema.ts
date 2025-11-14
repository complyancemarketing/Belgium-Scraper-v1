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
  status: z.enum(['idle', 'scraping', 'completed', 'error']),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  totalPagesCrawled: z.number(),
  eInvoicingPagesFound: z.number(),
  duplicatesIgnored: z.number(),
  maxPages: z.number(),
  errorMessage: z.string().optional(),
});

export const insertScrapedPageSchema = scrapedPageSchema.omit({ id: true });
export const insertScrapingSessionSchema = scrapingSessionSchema.omit({ id: true });

export type ScrapedPage = z.infer<typeof scrapedPageSchema>;
export type InsertScrapedPage = z.infer<typeof insertScrapedPageSchema>;
export type ScrapingSession = z.infer<typeof scrapingSessionSchema>;
export type InsertScrapingSession = z.infer<typeof insertScrapingSessionSchema>;
