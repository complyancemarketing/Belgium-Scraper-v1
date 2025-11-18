import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startScraping, stopScraping, isScrapingInProgress } from "./scraper";
import {
  clearAllCloudData,
  fetchPersistedPages,
  getAppSettings,
  updateAppSettings,
  fetchAllEInvoicingPages,
  fetchCloudStats,
} from "./persistence";
import { isSupabaseEnabled } from "./supabase";
import { sendTeamsNotification } from "./integrations/teams";

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
      if (isSupabaseEnabled) {
        const persisted = await fetchPersistedPages();
        if (persisted.length > 0) {
          return res.json(persisted);
        }
      }
      const fallback = await storage.getAllPages();
      res.json(fallback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pages' });
    }
  });

  app.post('/api/scrape/start', async (req, res) => {
    if (isScrapingInProgress()) {
      return res.status(400).json({ error: 'Scraping is already in progress' });
    }

    const { onlyNew } = (req.body ?? {}) as { onlyNew?: boolean };

    startScraping({
      mode: "manual",
      onlyNew: onlyNew === true,
    }).catch(error => {
      console.error('Scraping error:', error);
    });

    res.json({ message: 'Scraping started' });
  });

  app.post('/api/scrape/stop', async (_req, res) => {
    if (!isScrapingInProgress()) {
      return res.status(400).json({ error: 'Scraping is not in progress' });
    }

    stopScraping();
    res.json({ message: 'Scraping stop requested' });
  });

  app.get('/api/settings', async (_req, res) => {
    try {
      const settings = await getAppSettings();
      res.json({ ...settings, cloudEnabled: isSupabaseEnabled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const { autoRunEnabled, teamsWebhookUrl } = req.body as {
        autoRunEnabled?: boolean;
        teamsWebhookUrl?: string | null;
      };

      if (typeof autoRunEnabled !== "undefined" && typeof autoRunEnabled !== "boolean") {
        return res.status(400).json({ error: "autoRunEnabled must be a boolean" });
      }

      if (
        typeof teamsWebhookUrl !== "undefined" &&
        teamsWebhookUrl !== null &&
        typeof teamsWebhookUrl !== "string"
      ) {
        return res.status(400).json({ error: "teamsWebhookUrl must be a string or null" });
      }

      const updated = await updateAppSettings({
        ...(typeof autoRunEnabled === "boolean" ? { autoRunEnabled } : {}),
        ...(typeof teamsWebhookUrl !== "undefined" ? { teamsWebhookUrl } : {}),
      });

      res.json({ ...updated, cloudEnabled: isSupabaseEnabled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/reset', async (_req, res) => {
    if (isScrapingInProgress()) {
      return res.status(400).json({ error: 'Cannot reset while scraping is running' });
    }

    try {
      await storage.resetAll();
      await clearAllCloudData();
      res.json({ message: 'All data cleared' });
    } catch (error) {
      console.error('Failed to reset data:', error);
      res.status(500).json({ error: 'Failed to reset data' });
    }
  });

  app.post('/api/teams/send', async (_req, res) => {
    try {
      const settings = await getAppSettings();
      if (!settings.teamsWebhookUrl) {
        return res.status(400).json({ error: "Teams webhook is not configured" });
      }
      const pages = await fetchAllEInvoicingPages();
      if (pages.length === 0) {
        return res.status(400).json({ error: "No e-invoicing pages to send" });
      }

      await sendTeamsNotification(settings.teamsWebhookUrl, pages);
      res.json({ message: `Sent ${pages.length} e-invoicing pages to Teams` });
    } catch (error) {
      console.error("Failed to send Teams notification:", error);
      res.status(500).json({ error: "Failed to send Teams notification" });
    }
  });

  app.get('/api/stats', async (_req, res) => {
    try {
      if (isSupabaseEnabled) {
        const stats = await fetchCloudStats();
        return res.json(stats);
      }

      const session = await storage.getSession();
      res.json({
        totalPages: session.totalPagesCrawled,
        einvoicingPages: session.eInvoicingPagesFound,
        lastScrapeAt: session.completedAt ?? session.startedAt ?? null,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
