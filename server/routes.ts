import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startScraping, isScrapingInProgress } from "./scraper";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/session', async (_req, res) => {
    try {
      const session = await storage.getSession();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  app.get('/api/pages', async (_req, res) => {
    try {
      const pages = await storage.getAllPages();
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pages' });
    }
  });

  app.post('/api/scrape/start', async (_req, res) => {
    if (isScrapingInProgress()) {
      return res.status(400).json({ error: 'Scraping is already in progress' });
    }

    startScraping().catch(error => {
      console.error('Scraping error:', error);
    });

    res.json({ message: 'Scraping started' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
