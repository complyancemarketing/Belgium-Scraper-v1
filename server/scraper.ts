import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';
import {
  getAppSettings,
  getKnownUrlHashes,
  hashUrl,
  recordScrapeRun,
  savePageToCloud,
} from "./persistence";
import { sendTeamsNotification } from "./integrations/teams";

const BASE_URL = 'https://bosa.belgium.be';
const SITEMAP_INDEX_URL = 'https://bosa.belgium.be/sitemap.xml';
const DELAY_BETWEEN_REQUESTS = 500;
const MAX_QUEUE_SIZE = 10000; // Increased to handle more URLs

const E_INVOICING_KEYWORDS = [
  // English
  'e-invoice',
  'e-invoicing',
  'einvoice',
  'einvoicing',
  'electronic invoice',
  'electronic invoicing',
  'digital invoice',
  'digital invoicing',
  'tax invoice',
  'vat invoice',
  'electronic billing',
  'e-billing',
  'peppol',
  'ubl',
  'xml invoice',
  'structured invoice',
  'invoice automation',
  
  // French (Français)
  'facturation électronique',
  'facture électronique',
  'e-facturation',
  'e-facture',
  'facture numérique',
  'facturation numérique',
  'facture digitale',
  'facturation digitale',
  'facture xml',
  'facture structurée',
  
  // Dutch (Nederlands)
  'elektronische facturering',
  'elektronische factuur',
  'elektronische facturatie',
  'e-facturering',
  'e-factuur',
  'digitale facturering',
  'digitale factuur',
  'gestructureerde factuur',
  'xml factuur',
  'facturatie',
  
  // German (Deutsch)
  'elektronische rechnung',
  'e-rechnung',
  'digitale rechnung',
  'elektronische rechnungsstellung',
  'xml rechnung',
  'strukturierte rechnung',
  'rechnungsautomatisierung',
];

interface CrawlResult {
  success: boolean;
  error?: string;
}

let isCurrentlyScraping = false;
let shouldStopScraping = false;

interface ScrapeOptions {
  mode?: "manual" | "auto";
  onlyNew?: boolean;
}

/**
 * Parse sitemap index XML and extract sitemap URLs
 */
async function parseSitemapIndex(sitemapIndexUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(sitemapIndexUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const sitemapUrls: string[] = [];

    // Extract sitemap URLs from index
    $('sitemap > loc').each((_, element) => {
      const sitemapUrl = $(element).text().trim();
      if (sitemapUrl) {
        sitemapUrls.push(sitemapUrl);
      }
    });

    return sitemapUrls;
  } catch (error) {
    console.error(`Error parsing sitemap index ${sitemapIndexUrl}:`, error);
    return [];
  }
}

/**
 * Parse regular sitemap XML and extract page URLs
 */
async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(sitemapUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const pageUrls: string[] = [];

    // Extract page URLs from sitemap
    $('url > loc').each((_, element) => {
      const pageUrl = $(element).text().trim();
      if (pageUrl && pageUrl.startsWith(BASE_URL)) {
        pageUrls.push(pageUrl);
      }
    });

    return pageUrls;
  } catch (error) {
    console.error(`Error parsing sitemap ${sitemapUrl}:`, error);
    return [];
  }
}

/**
 * Fetch all URLs from sitemaps
 */
async function fetchUrlsFromSitemaps(): Promise<string[]> {
  const allUrls = new Set<string>();
  
  try {
    console.log('Fetching sitemap...');
    await storage.updateSession({ currentUrl: SITEMAP_INDEX_URL });
    
    // First, try to parse as sitemap index
    const sitemapUrls = await parseSitemapIndex(SITEMAP_INDEX_URL);
    
    if (sitemapUrls.length > 0) {
      // It's a sitemap index - fetch each sitemap
      console.log(`Found ${sitemapUrls.length} sitemaps in index`);
      
      for (let i = 0; i < sitemapUrls.length; i++) {
        if (shouldStopScraping) break;
        
        const sitemapUrl = sitemapUrls[i];
        await storage.updateSession({ currentUrl: `Parsing sitemap ${i + 1}/${sitemapUrls.length}: ${sitemapUrl}` });
        
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        
        const pageUrls = await parseSitemap(sitemapUrl);
        pageUrls.forEach(url => allUrls.add(url));
        
        console.log(`Sitemap ${i + 1}/${sitemapUrls.length}: Found ${pageUrls.length} URLs (Total: ${allUrls.size})`);
      }
    } else {
      // It's a regular sitemap - parse it directly
      console.log('No sitemap index found, treating as regular sitemap');
      const pageUrls = await parseSitemap(SITEMAP_INDEX_URL);
      pageUrls.forEach(url => allUrls.add(url));
      console.log(`Found ${pageUrls.length} URLs in sitemap`);
    }

    console.log(`Total URLs discovered from sitemaps: ${allUrls.size}`);
    return Array.from(allUrls);
  } catch (error) {
    console.error('Error fetching sitemaps:', error);
    return Array.from(allUrls);
  }
}

export async function startScraping(
  options: ScrapeOptions = {}
): Promise<CrawlResult> {
  if (isCurrentlyScraping) {
    return { success: false, error: 'Scraping is already in progress' };
  }

  isCurrentlyScraping = true;
  shouldStopScraping = false; // Reset stop flag
  const mode = options.mode ?? "manual";
  const onlyNew = options.onlyNew ?? false;
  const runStartedAt = new Date();
  const newEinvoicingPages: Array<{ title: string; url: string }> = [];
  let pagesCrawled = 0;

  try {
    await storage.updateSession({
      status: 'scraping',
      startedAt: new Date().toISOString(),
      totalPagesCrawled: 0,
      eInvoicingPagesFound: 0,
      duplicatesIgnored: 0,
      maxPages: undefined, // No limit - crawl all URLs
      currentUrl: undefined,
    });

    await storage.clearPages();
    await storage.clearVisitedUrls();

    console.log('Starting scraper - fetching URLs from sitemaps...');
    
    // Fetch all URLs from sitemaps
    const sitemapUrls = await fetchUrlsFromSitemaps();
    
    if (sitemapUrls.length === 0) {
      console.warn('No URLs found in sitemaps, falling back to link crawling');
      // Fallback: start with home page if sitemaps fail
      sitemapUrls.push('https://bosa.belgium.be/');
    }
    
    const existingUrlHashes = await getKnownUrlHashes();
    let urlQueue: string[] = [...sitemapUrls];
    if (onlyNew) {
      urlQueue = urlQueue.filter((url) => !existingUrlHashes.has(hashUrl(url)));
    }
    if (urlQueue.length === 0) {
      console.log('No new URLs to crawl based on persistence cache.');
    }
    const urlQueueSet = new Set<string>(urlQueue); // Track URLs in queue for O(1) lookup
    let duplicatesIgnored = 0;

    console.log(`Starting to crawl ${urlQueue.length} URLs from sitemaps`);

    while (urlQueue.length > 0 && !shouldStopScraping) {
      const currentUrl = urlQueue.shift()!;
      urlQueueSet.delete(currentUrl); // Remove from set when processing

      // Check if we should stop before processing
      if (shouldStopScraping) {
        break;
      }

      if (await storage.hasVisitedUrl(currentUrl)) {
        duplicatesIgnored++;
        await storage.updateSession({ 
          duplicatesIgnored,
          currentUrl, // Show URL even when skipping duplicates
        });
        continue;
      }

      await storage.addVisitedUrl(currentUrl);
      
      // Update current URL being crawled
      await storage.updateSession({ currentUrl });

      try {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

        const response = await axios.get(currentUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          maxRedirects: 5,
          maxContentLength: 5 * 1024 * 1024,
        });

        const html = response.data;
        const $ = cheerio.load(html);

        $('script, style, nav, footer, header').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        const title = $('title').text().trim() || 'Untitled Page';

        const isEInvoicingRelated = E_INVOICING_KEYWORDS.some(keyword =>
          textContent.toLowerCase().includes(keyword) ||
          title.toLowerCase().includes(keyword) ||
          currentUrl.toLowerCase().includes(keyword)
        );

        pagesCrawled++;
        const contentPreview = textContent.substring(0, 500);
        const scrapedAt = new Date().toISOString();

        const persistenceResult = await savePageToCloud({
          url: currentUrl,
          title,
          content: contentPreview,
          scrapedAt,
          isEInvoicing: isEInvoicingRelated,
        });

        if (isEInvoicingRelated) {
          // Only add e-invoicing pages to in-memory storage
          await storage.addPage({
            url: currentUrl,
            title,
            content: contentPreview,
            scrapedAt,
          });

          const session = await storage.getSession();
          await storage.updateSession({
            totalPagesCrawled: pagesCrawled,
            eInvoicingPagesFound: session.eInvoicingPagesFound + 1,
            currentUrl, // Preserve currentUrl in all updates
          });

          if (persistenceResult.isNew) {
            newEinvoicingPages.push({ title, url: currentUrl });
          }

          // Log to server console
          console.log(`✓ Found e-invoicing page: ${title} - ${currentUrl}`);
        } else {
          await storage.updateSession({
            totalPagesCrawled: pagesCrawled,
            currentUrl, // Preserve currentUrl in all updates
          });
        }

        // Note: We're using sitemaps for URL discovery, so we don't need to extract links
        // from pages. This makes crawling faster and more comprehensive.
        // If you want to also follow links found on pages, uncomment the code below:
        /*
        const links = $('a[href]').map((_, element) => $(element).attr('href')).get();
        
        for (const href of links) {
          if (!href) continue;
          if (urlQueue.length >= MAX_QUEUE_SIZE) {
            console.warn(`Queue size limit reached (${MAX_QUEUE_SIZE}), skipping additional URLs`);
            break;
          }

          let absoluteUrl: string;
          try {
            if (href.startsWith('http://') || href.startsWith('https://')) {
              absoluteUrl = href;
            } else if (href.startsWith('/')) {
              absoluteUrl = BASE_URL + href;
            } else if (href.startsWith('#') || href.startsWith('javascript:')) {
              continue;
            } else {
              const base = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
              absoluteUrl = new URL(href, base).href;
            }

            if (absoluteUrl.startsWith(BASE_URL) && !absoluteUrl.includes('#')) {
              const cleanUrl = absoluteUrl.split('?')[0];
              // Check if URL is already visited or in queue before adding
              const alreadyVisited = await storage.hasVisitedUrl(cleanUrl);
              if (!alreadyVisited && !urlQueueSet.has(cleanUrl)) {
                urlQueue.push(cleanUrl);
                urlQueueSet.add(cleanUrl);
              }
            }
          } catch (error) {
            // Invalid URL, skip
          }
        }
        */
        
        // Log progress every 10 pages
        if (pagesCrawled % 10 === 0) {
          const currentSession = await storage.getSession();
          console.log(`Progress: ${pagesCrawled} pages crawled, ${urlQueue.length} URLs in queue, ${currentSession.eInvoicingPagesFound} e-invoicing pages found`);
        }

      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error);
        pagesCrawled++;
        await storage.updateSession({ 
          totalPagesCrawled: pagesCrawled,
          currentUrl, // Keep showing the URL even on error
        });
      }
    }

    if (shouldStopScraping) {
      const finalSession = await storage.getSession();
      console.log(`Scraping stopped: ${pagesCrawled} pages crawled, ${finalSession.eInvoicingPagesFound} e-invoicing pages found`);
      await finalizeRun(
        "stopped",
        pagesCrawled,
        mode,
        runStartedAt,
        newEinvoicingPages
      );
      isCurrentlyScraping = false;
      shouldStopScraping = false;
      return { success: true };
    }

    const finalSession = await storage.getSession();
    console.log(`Scraping completed: ${pagesCrawled} pages crawled, ${finalSession.eInvoicingPagesFound} e-invoicing pages found`);
    await finalizeRun(
      "completed",
      pagesCrawled,
      mode,
      runStartedAt,
      newEinvoicingPages
    );

    isCurrentlyScraping = false;
    shouldStopScraping = false;
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    await storage.updateSession({
      status: 'error',
      errorMessage,
    });

    await recordScrapeRun({
      mode,
      startedAt: runStartedAt.toISOString(),
      completedAt: new Date().toISOString(),
      totalPagesCrawled: pagesCrawled,
      newEInvoicingPages: newEinvoicingPages.length,
    });

    isCurrentlyScraping = false;
    shouldStopScraping = false;
    return { success: false, error: errorMessage };
  }
}

export function stopScraping(): void {
  shouldStopScraping = true;
}

export function isScrapingInProgress(): boolean {
  return isCurrentlyScraping;
}

async function finalizeRun(
  status: "completed" | "stopped",
  pagesCrawled: number,
  mode: "manual" | "auto",
  runStartedAt: Date,
  newEinvoicingPages: Array<{ title: string; url: string }>
) {
  const completedAt = new Date();
  await storage.updateSession({
    status,
    completedAt: completedAt.toISOString(),
    currentUrl: undefined,
  });

  await recordScrapeRun({
    mode,
    startedAt: runStartedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    totalPagesCrawled: pagesCrawled,
    newEInvoicingPages: newEinvoicingPages.length,
  });

  await notifyTeamsAboutFindings(newEinvoicingPages);
}

async function notifyTeamsAboutFindings(
  pages: Array<{ title: string; url: string }>
) {
  if (pages.length === 0) return;
  const settings = await getAppSettings();
  if (!settings.teamsWebhookUrl) return;

  try {
    await sendTeamsNotification(settings.teamsWebhookUrl, pages);
  } catch (error) {
    console.error("Failed to notify Teams channel:", error);
  }
}
