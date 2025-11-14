import { type ScrapedPage, type InsertScrapedPage, type ScrapingSession, type InsertScrapingSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSession(): Promise<ScrapingSession>;
  updateSession(session: Partial<ScrapingSession>): Promise<ScrapingSession>;
  
  getAllPages(): Promise<ScrapedPage[]>;
  addPage(page: InsertScrapedPage): Promise<ScrapedPage>;
  clearPages(): Promise<void>;
  
  addVisitedUrl(url: string): Promise<void>;
  hasVisitedUrl(url: string): Promise<boolean>;
  clearVisitedUrls(): Promise<void>;
}

export class MemStorage implements IStorage {
  private pages: Map<string, ScrapedPage>;
  private session: ScrapingSession;
  private visitedUrls: Set<string>;

  constructor() {
    this.pages = new Map();
    this.visitedUrls = new Set();
    this.session = {
      id: randomUUID(),
      status: 'idle',
      totalPagesCrawled: 0,
      eInvoicingPagesFound: 0,
      duplicatesIgnored: 0,
    };
  }

  async getSession(): Promise<ScrapingSession> {
    return { ...this.session };
  }

  async updateSession(updates: Partial<ScrapingSession>): Promise<ScrapingSession> {
    this.session = { ...this.session, ...updates };
    return { ...this.session };
  }

  async getAllPages(): Promise<ScrapedPage[]> {
    return Array.from(this.pages.values());
  }

  async addPage(insertPage: InsertScrapedPage): Promise<ScrapedPage> {
    const id = randomUUID();
    const page: ScrapedPage = { ...insertPage, id };
    this.pages.set(id, page);
    return page;
  }

  async clearPages(): Promise<void> {
    this.pages.clear();
  }

  async addVisitedUrl(url: string): Promise<void> {
    this.visitedUrls.add(url);
  }

  async hasVisitedUrl(url: string): Promise<boolean> {
    return this.visitedUrls.has(url);
  }

  async clearVisitedUrls(): Promise<void> {
    this.visitedUrls.clear();
  }
}

export const storage = new MemStorage();
