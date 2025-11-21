import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as belgiumStorage } from "./storage";
import { startScraping, stopScraping, isScrapingInProgress } from "./scraper";
import {
  clearAllCloudData as clearBelgiumCloudData,
  fetchPersistedPages as fetchBelgiumPages,
  getAppSettings as getBelgiumAppSettings,
  updateAppSettings as updateBelgiumAppSettings,
  fetchAllEInvoicingPages as fetchBelgiumEInvoicingPages,
  fetchCloudStats as fetchBelgiumCloudStats,
} from "./persistence";
import { isSupabaseEnabled } from "./supabase";
import { sendTeamsNotification } from "./integrations/teams";
import { storage as uaeStorage } from "./uae/storage";
import {
  startScraping as startUaeScraping,
  stopScraping as stopUaeScraping,
  isScrapingInProgress as isUaeScrapingInProgress,
} from "./uae/scraper";
import {
  clearAllCloudData as clearUaeCloudData,
  fetchPersistedPages as fetchUaePages,
  getAppSettings as getUaeAppSettings,
  updateAppSettings as updateUaeAppSettings,
  fetchAllEInvoicingPages as fetchUaeEInvoicingPages,
  fetchCloudStats as fetchUaeCloudStats,
} from "./uae/persistence";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/session', async (_req, res) => {
    try {
      const session = await belgiumStorage.getSession();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  app.get('/api/pages', async (_req, res) => {
    try {
      if (isSupabaseEnabled) {
        const persisted = await fetchBelgiumPages();
        if (persisted.length > 0) {
          return res.json(persisted);
        }
      }
      const fallback = await belgiumStorage.getAllPages();
      res.json(fallback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pages' });
    }
  });

  app.post('/api/scrape/start', async (req, res) => {
    const belgiumBusy = isScrapingInProgress();
    const uaeBusy = isUaeScrapingInProgress();
    if (belgiumBusy || uaeBusy) {
      return res.status(400).json({ error: 'One of the scrapers is already running' });
    }

    const { onlyNew } = (req.body ?? {}) as { onlyNew?: boolean };

    startScraping({
      mode: "manual",
      onlyNew: onlyNew === true,
    }).catch(error => {
      console.error('Belgium scraping error:', error);
    });

    startUaeScraping({
      mode: "manual",
      onlyNew: onlyNew === true,
    }).catch(error => {
      console.error('[uae] Scraping error:', error);
    });

    res.json({ message: 'Belgium and UAE scrapers started' });
  });

  app.post('/api/scrape/stop', async (_req, res) => {
    const belgiumBusy = isScrapingInProgress();
    const uaeBusy = isUaeScrapingInProgress();
    if (!belgiumBusy && !uaeBusy) {
      return res.status(400).json({ error: 'Scraping is not in progress' });
    }

    if (belgiumBusy) {
    stopScraping();
    }
    if (uaeBusy) {
      stopUaeScraping();
    }
    res.json({ message: 'Stop requested for active scrapers' });
  });

  app.get('/api/settings', async (_req, res) => {
    try {
      const settings = await getBelgiumAppSettings();
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

      const updated = await updateBelgiumAppSettings({
        ...(typeof autoRunEnabled === "boolean" ? { autoRunEnabled } : {}),
        ...(typeof teamsWebhookUrl !== "undefined" ? { teamsWebhookUrl } : {}),
      });

      res.json({ ...updated, cloudEnabled: isSupabaseEnabled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/reset', async (_req, res) => {
    if (isScrapingInProgress() || isUaeScrapingInProgress()) {
      return res.status(400).json({ error: 'Cannot reset while a scraper is running' });
    }

    try {
      await Promise.all([
        belgiumStorage.resetAll(),
        uaeStorage.resetAll(),
        clearBelgiumCloudData(),
        clearUaeCloudData(),
      ]);
      res.json({ message: 'All data cleared' });
    } catch (error) {
      console.error('Failed to reset data:', error);
      res.status(500).json({ error: 'Failed to reset data' });
    }
  });

  app.post('/api/teams/send', async (_req, res) => {
    try {
      const settings = await getBelgiumAppSettings();
      if (!settings.teamsWebhookUrl) {
        return res.status(400).json({ error: "Teams webhook is not configured" });
      }
      const pages = await fetchBelgiumEInvoicingPages();
      if (pages.length === 0) {
        return res.status(400).json({ error: "No e-invoicing pages to send" });
      }

      await sendTeamsNotification(settings.teamsWebhookUrl, pages, "Belgium");
      res.json({ message: `Sent ${pages.length} e-invoicing pages to Teams` });
    } catch (error) {
      console.error("Failed to send Teams notification:", error);
      res.status(500).json({ error: "Failed to send Teams notification" });
    }
  });

  app.get('/api/stats', async (_req, res) => {
    try {
      if (isSupabaseEnabled) {
        const stats = await fetchBelgiumCloudStats();
        return res.json(stats);
      }

      const session = await belgiumStorage.getSession();
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

  // UAE routes
  app.get('/api/uae/session', async (_req, res) => {
    try {
      const session = await uaeStorage.getSession();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get UAE session' });
    }
  });

  app.get('/api/uae/pages', async (_req, res) => {
    try {
      if (isSupabaseEnabled) {
        const persisted = await fetchUaePages();
        if (persisted.length > 0) {
          return res.json(persisted);
        }
      }
      const fallback = await uaeStorage.getAllPages();
      res.json(fallback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get UAE pages' });
    }
  });

  app.post('/api/uae/scrape/start', async (req, res) => {
    if (isUaeScrapingInProgress()) {
      return res.status(400).json({ error: 'Scraping is already in progress' });
    }

    const { onlyNew } = (req.body ?? {}) as { onlyNew?: boolean };

    startUaeScraping({
      mode: "manual",
      onlyNew: onlyNew === true,
    }).catch(error => {
      console.error('[uae] Scraping error:', error);
    });

    res.json({ message: 'Scraping started' });
  });

  app.post('/api/uae/scrape/stop', async (_req, res) => {
    if (!isUaeScrapingInProgress()) {
      return res.status(400).json({ error: 'Scraping is not in progress' });
    }

    stopUaeScraping();
    res.json({ message: 'Scraping stop requested' });
  });

  app.get('/api/uae/settings', async (_req, res) => {
    try {
      const settings = await getUaeAppSettings();
      res.json({ ...settings, cloudEnabled: isSupabaseEnabled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load UAE settings' });
    }
  });

  app.post('/api/uae/settings', async (req, res) => {
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

      const updated = await updateUaeAppSettings({
        ...(typeof autoRunEnabled === "boolean" ? { autoRunEnabled } : {}),
        ...(typeof teamsWebhookUrl !== "undefined" ? { teamsWebhookUrl } : {}),
      });

      res.json({ ...updated, cloudEnabled: isSupabaseEnabled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update UAE settings' });
    }
  });

  app.post('/api/uae/reset', async (_req, res) => {
    if (isUaeScrapingInProgress()) {
      return res.status(400).json({ error: 'Cannot reset while scraping is running' });
    }

    try {
      await uaeStorage.resetAll();
      await clearUaeCloudData();
      res.json({ message: 'All UAE data cleared' });
    } catch (error) {
      console.error('[uae] Failed to reset data:', error);
      res.status(500).json({ error: 'Failed to reset UAE data' });
    }
  });

  app.post('/api/uae/teams/send', async (_req, res) => {
    try {
      // Use global settings (shared Teams webhook from home page)
      const settings = await getBelgiumAppSettings();
      if (!settings.teamsWebhookUrl) {
        return res.status(400).json({ error: "Teams webhook is not configured on the home page" });
      }
      const pages = await fetchUaeEInvoicingPages();
      if (pages.length === 0) {
        return res.status(400).json({ error: "No e-invoicing pages to send" });
      }

      await sendTeamsNotification(settings.teamsWebhookUrl, pages, "UAE");
      res.json({ message: `Sent ${pages.length} e-invoicing pages to Teams` });
    } catch (error) {
      console.error("[uae] Failed to send Teams notification:", error);
      res.status(500).json({ error: "Failed to send Teams notification" });
    }
  });

  app.get('/api/uae/stats', async (_req, res) => {
    try {
      if (isSupabaseEnabled) {
        const stats = await fetchUaeCloudStats();
        return res.json(stats);
      }

      const session = await uaeStorage.getSession();
      res.json({
        totalPages: session.totalPagesCrawled,
        einvoicingPages: session.eInvoicingPagesFound,
        lastScrapeAt: session.completedAt ?? session.startedAt ?? null,
      });
    } catch (error) {
      console.error("[uae] Failed to load stats:", error);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
