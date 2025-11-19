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
import { generateSummary } from "./ai-summarizer";

const BASE_URL = 'https://bosa.belgium.be';
const SITEMAP_INDEX_URL = 'https://bosa.belgium.be/sitemap.xml';
const DELAY_BETWEEN_REQUESTS = 500;
const MAX_QUEUE_SIZE = 10000; // Increased to handle more URLs

const E_INVOICING_KEYWORDS = [
  // English
  'e-invoice', 'e-invoices', 'e-invoicing',
  'einvoice', 'einvoices', 'einvoicing',
  'electronic invoice', 'electronic invoices', 'electronic invoicing',
  'digital invoice', 'digital invoices', 'digital invoicing',
  'online invoice', 'online invoices', 'online invoicing',
  'tax invoice', 'tax invoices',
  'vat invoice', 'vat invoices',
  'electronic billing', 'digital billing', 'online billing',
  'e-billing',
  'peppol', 'peppol network', 'peppol authority', 'peppol access point',
  'ubl', 'universal business language',
  'xml invoice', 'xml invoices', 'xml invoicing',
  'structured invoice', 'structured invoices',
  'invoice automation', 'automated invoicing',
  'invoice digitization', 'invoice digitisation',
  'paperless invoicing', 'paperless invoice',
  
  // French (Français)
  'facturation électronique', 'facture électronique', 'factures électroniques',
  'e-facturation', 'e-facture', 'e-factures',
  'facture numérique', 'factures numériques', 'facturation numérique',
  'facture digitale', 'factures digitales', 'facturation digitale',
  'facture en ligne', 'factures en ligne', 'facturation en ligne',
  'facture xml', 'factures xml',
  'facture structurée', 'factures structurées',
  'dématérialisation des factures', 'dématérialisation facture',
  'traitement des factures électroniques',
  'automatisation des factures', 'automatisation facture',
  'facturation sans papier',
  'autorité peppol', 'réseau peppol',
  
  // Dutch (Nederlands)
  'elektronische facturering', 'elektronische factureren', 'elektronisch factureren',
  'elektronische factuur', 'elektronische facturen',
  'elektronische facturatie',
  'e-facturering', 'e-factureren',
  'e-factuur', 'e-facturen', 'e-facturatie',
  'digitale facturering', 'digitale factureren',
  'digitale factuur', 'digitale facturen',
  'online facturering', 'online factuur', 'online facturen',
  'gestructureerde factuur', 'gestructureerde facturen',
  'xml factuur', 'xml facturen',
  'facturatie automatisering', 'geautomatiseerde facturering',
  'digitalisering van facturen', 'facturatie digitalisering',
  'papierloze facturering', 'papierloze facturen',
  'verwerking van e-facturen',
  'peppol autoriteit', 'peppol netwerk',
  'btw factuur', 'btw facturen',
  
  // German (Deutsch)
  'elektronische rechnung', 'elektronische rechnungen',
  'e-rechnung', 'e-rechnungen',
  'digitale rechnung', 'digitale rechnungen',
  'online rechnung', 'online rechnungen',
  'elektronische rechnungsstellung',
  'xml rechnung', 'xml rechnungen',
  'strukturierte rechnung', 'strukturierte rechnungen',
  'rechnungsautomatisierung', 'automatisierte rechnungsstellung',
  'digitalisierung von rechnungen', 'rechnungsdigitalisierung',
  'papierlose rechnung', 'papierlose rechnungen',
  'peppol behörde', 'peppol netzwerk',
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

/**
 * Check if content is related to e-invoicing with enhanced pattern matching
 */
function checkEInvoicingMatch(text: string, title: string, url: string): { isMatch: boolean; keyword?: string } {
  // First check exact keyword matches with word boundaries
  for (const keyword of E_INVOICING_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text) || regex.test(title) || regex.test(url)) {
      return { isMatch: true, keyword };
    }
  }

  // Pattern-based detection for compound words and variations (more strict)
  const patterns = [
    // E-invoice variations - must have "e" prefix
    /\be[\s-]invoices?\b/i,
    /\be[\s-]invoicing\b/i,
    /\be[\s-]billing\b/i,
    
    // French variations - must have "e" prefix  
    /\be[\s-]factures?\b/i,
    /\be[\s-]facturation\b/i,
    
    // Dutch variations - must have "e" prefix
    /\be[\s-]factuu?re?n?\b/i,
    /\be[\s-]facturering\b/i,
    /\be[\s-]facturatie\b/i,
    
    // German variations - must have "e" prefix
    /\be[\s-]rechnunge?n?\b/i,
    
    // Electronic/digital + invoice/facture/factuur/rechnung (must have both words)
    /\b(electronic|digital|online|digitale?|électronique|elektronische?)\s+(invoice|invoicing|facture|facturation|factuu?r|facturering|rechnung)e?s?\b/i,
    
    // PEPPOL (strong indicator)
    /\bpeppol\b/i,
    
    // XML/UBL invoice patterns
    /\b(xml|ubl)[\s-]?(invoice|facture|factuu?r|rechnung)e?s?\b/i,
    
    // Structured invoice patterns
    /\b(structured|structurée|gestructureerde)[\s-]?(invoice|facture|factuu?r)e?s?\b/i,
  ];

  const combinedText = `${text} ${title} ${url}`.toLowerCase();
  
  for (const pattern of patterns) {
    if (pattern.test(combinedText)) {
      // Extract the matched text for reporting
      const match = combinedText.match(pattern);
      return { isMatch: true, keyword: match ? match[0] : 'pattern match' };
    }
  }

  return { isMatch: false };
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
  const newEinvoicingPages: Array<{ title: string; url: string; summary?: string; matchedKeyword?: string }> = [];
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

        // Remove common non-content sections
        $('script, style, nav, footer, header').remove();
        
        // Remove application/service widget sections (not the main application page content)
        $('.applications-widget, .more-applications, aside.applications, .sidebar-applications').remove();
        
        // Find and remove widget headings and their immediate sibling content
        // This targets "Meer applicaties", "Anwendungen", etc. when they appear as widgets
        $('h2, h3, h4, h5').filter((_, el) => {
          const text = $(el).text().trim().toLowerCase();
          return text === 'meer applicaties' || 
                 text === 'more applications' || 
                 text === 'plus d\'applications' ||
                 text === 'weitere anwendungen' ||
                 text === 'anwendungen' ||
                 text === 'applicaties' ||
                 text === 'applications';
        }).each((_, el) => {
          // Only remove if this is a widget section (has related links/items)
          const $heading = $(el);
          const $nextContent = $heading.nextUntil('h1, h2, h3, h4, h5');
          
          // If the section contains multiple links (typical of widgets), remove it
          const linkCount = $nextContent.find('a').length;
          if (linkCount >= 2) {
            $heading.remove();
            $nextContent.remove();
          }
        });
        
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        const title = $('title').text().trim() || 'Untitled Page';

        // Find which keyword matched (with enhanced pattern detection)
        const matchResult = checkEInvoicingMatch(textContent, title, currentUrl);
        const isEInvoicingRelated = matchResult.isMatch;
        const matchedKeyword = matchResult.keyword;

        if (isEInvoicingRelated) {
          console.log(`🔍 E-invoicing page found: "${title}" - Keyword: "${matchedKeyword}"`);
        }

        pagesCrawled++;
        const contentPreview = textContent.substring(0, 500);
        const scrapedAt = new Date().toISOString();

        // Generate AI summary for e-invoicing pages
        let summary: string | undefined;
        if (isEInvoicingRelated) {
          try {
            summary = await generateSummary({
              title,
              content: textContent.substring(0, 2000), // Use more content for better summary
              url: currentUrl,
            });
            console.log(`📝 Generated summary for: ${title}`);
          } catch (error) {
            console.error(`Failed to generate summary for ${currentUrl}:`, error);
          }
        }

        const persistenceResult = await savePageToCloud({
          url: currentUrl,
          title,
          content: contentPreview,
          scrapedAt,
          isEInvoicing: isEInvoicingRelated,
          summary,
          matchedKeyword,
        });

        if (isEInvoicingRelated) {
          // Only add e-invoicing pages to in-memory storage
          await storage.addPage({
            url: currentUrl,
            title,
            content: contentPreview,
            scrapedAt,
            summary,
            matchedKeyword,
          });

          const session = await storage.getSession();
          await storage.updateSession({
            totalPagesCrawled: pagesCrawled,
            eInvoicingPagesFound: session.eInvoicingPagesFound + 1,
            currentUrl, // Preserve currentUrl in all updates
          });

          if (persistenceResult.isNew) {
            newEinvoicingPages.push({ title, url: currentUrl, summary, matchedKeyword });
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
  pages: Array<{ title: string; url: string; summary?: string; matchedKeyword?: string }>
) {
  if (pages.length === 0) return;
  const settings = await getAppSettings();
  if (!settings.teamsWebhookUrl) return;

  try {
    await sendTeamsNotification(settings.teamsWebhookUrl, pages, "Belgium");
  } catch (error) {
    console.error("Failed to notify Teams channel:", error);
  }
}
