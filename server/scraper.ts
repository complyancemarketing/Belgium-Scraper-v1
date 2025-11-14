import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';

const BASE_URL = 'https://mof.gov.ae';
const START_URL = 'https://mof.gov.ae/en/home/';
const MAX_PAGES = 100;
const DELAY_BETWEEN_REQUESTS = 500;

const E_INVOICING_KEYWORDS = [
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
];

interface CrawlResult {
  success: boolean;
  error?: string;
}

let isCurrentlyScraping = false;

export async function startScraping(): Promise<CrawlResult> {
  if (isCurrentlyScraping) {
    return { success: false, error: 'Scraping is already in progress' };
  }

  isCurrentlyScraping = true;

  try {
    await storage.updateSession({
      status: 'scraping',
      startedAt: new Date().toISOString(),
      totalPagesCrawled: 0,
      eInvoicingPagesFound: 0,
      duplicatesIgnored: 0,
      maxPages: MAX_PAGES,
    });

    await storage.clearPages();
    await storage.clearVisitedUrls();

    const urlQueue: string[] = [START_URL];
    let pagesCrawled = 0;
    let duplicatesIgnored = 0;

    while (urlQueue.length > 0 && pagesCrawled < MAX_PAGES) {
      const currentUrl = urlQueue.shift()!;

      if (await storage.hasVisitedUrl(currentUrl)) {
        duplicatesIgnored++;
        await storage.updateSession({ duplicatesIgnored });
        continue;
      }

      await storage.addVisitedUrl(currentUrl);

      try {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

        const response = await axios.get(currentUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          maxRedirects: 5,
        });

        const $ = cheerio.load(response.data);

        $('script, style, nav, footer, header').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        const title = $('title').text().trim() || 'Untitled Page';

        const isEInvoicingRelated = E_INVOICING_KEYWORDS.some(keyword =>
          textContent.toLowerCase().includes(keyword) ||
          title.toLowerCase().includes(keyword) ||
          currentUrl.toLowerCase().includes(keyword)
        );

        pagesCrawled++;

        if (isEInvoicingRelated) {
          const contentPreview = textContent.substring(0, 500);

          await storage.addPage({
            url: currentUrl,
            title,
            content: contentPreview,
            scrapedAt: new Date().toISOString(),
          });

          const session = await storage.getSession();
          await storage.updateSession({
            totalPagesCrawled: pagesCrawled,
            eInvoicingPagesFound: session.eInvoicingPagesFound + 1,
          });
        } else {
          await storage.updateSession({
            totalPagesCrawled: pagesCrawled,
          });
        }

        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (!href) return;

          let absoluteUrl: string;
          try {
            if (href.startsWith('http://') || href.startsWith('https://')) {
              absoluteUrl = href;
            } else if (href.startsWith('/')) {
              absoluteUrl = BASE_URL + href;
            } else if (href.startsWith('#') || href.startsWith('javascript:')) {
              return;
            } else {
              const base = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
              absoluteUrl = new URL(href, base).href;
            }

            if (absoluteUrl.startsWith(BASE_URL) && !absoluteUrl.includes('#')) {
              const cleanUrl = absoluteUrl.split('?')[0];
              if (!urlQueue.includes(cleanUrl) && urlQueue.length < MAX_PAGES * 2) {
                urlQueue.push(cleanUrl);
              }
            }
          } catch (error) {
            // Invalid URL, skip
          }
        });

      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error);
        pagesCrawled++;
        await storage.updateSession({ totalPagesCrawled: pagesCrawled });
      }
    }

    await storage.updateSession({
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    isCurrentlyScraping = false;
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    await storage.updateSession({
      status: 'error',
      errorMessage,
    });

    isCurrentlyScraping = false;
    return { success: false, error: errorMessage };
  }
}

export function isScrapingInProgress(): boolean {
  return isCurrentlyScraping;
}
