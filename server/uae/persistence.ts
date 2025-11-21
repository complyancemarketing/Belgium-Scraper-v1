import { createHash } from "crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { AppSettings, InsertScrapedPage, ScrapedPage } from "@shared/schema";
import { supabase, isSupabaseEnabled } from "../supabase";

const PAGES_COLLECTION = "uae_page_cache";
const EINVOICING_COLLECTION = "uae_is_e_invoicing_pages";
const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "uae";
const RUNS_COLLECTION = "scrape_runs";

const defaultSettings: AppSettings = {
  autoRunEnabled: false,
  teamsWebhookUrl: null,
  lastAutoRunAt: null,
  lastManualRunAt: null,
};

export interface CloudStats {
  totalPages: number;
  einvoicingPages: number;
  lastScrapeAt: string | null;
}

const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL ?? null;
const sqlClient: NeonQueryFunction<any, any> | null = databaseUrl ? neon(databaseUrl) : null;

export function hashUrl(url: string): string {
  // Keep exported hash helper for scraper usage
  return createHash("sha256").update(url).digest("hex");
}

async function selectAllIds() {
  if (!isSupabaseEnabled || !supabase) return [];

  const pageSize = 1000;
  let from = 0;
  const ids: { id: string }[] = [];

  while (true) {
    const { data, error } = await supabase
      .from(PAGES_COLLECTION)
      .select("id")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("[supabase] Failed to fetch page hashes:", error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    ids.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return ids;
}

async function fetchPagesFromSql(): Promise<ScrapedPage[]> {
  if (!sqlClient) return [];
  try {
    // Fetch only e-invoicing pages from the dedicated table
    const rows = await sqlClient`
      SELECT id, url, title, content, scraped_at, summary, matched_keyword
      FROM uae_is_e_invoicing_pages
      ORDER BY scraped_at DESC
    ` as any[];
    return rows.map((row: any) => ({
      id: row.id as string,
      url: row.url as string,
      title: row.title as string,
      content: row.content as string,
      scrapedAt: row.scraped_at as string,
      summary: row.summary as string | undefined,
      matchedKeyword: row.matched_keyword as string | undefined,
    }));
  } catch (error) {
    console.error("[uae-sql] Failed to fetch e-invoicing pages:", error);
    return [];
  }
}

async function fetchStatsFromSql(): Promise<CloudStats | null> {
  if (!sqlClient) return null;
  try {
    const result = await sqlClient`
      SELECT
        (SELECT count(*)::int FROM uae_page_cache) AS total_pages,
        (SELECT count(*)::int FROM uae_is_e_invoicing_pages) AS einvoicing_pages,
        (SELECT max(scraped_at) FROM uae_is_e_invoicing_pages) AS last_scrape_at
    ` as any[];
    const [row] = result;
    return {
      totalPages: Number(row?.total_pages ?? 0),
      einvoicingPages: Number(row?.einvoicing_pages ?? 0),
      lastScrapeAt: row?.last_scrape_at
        ? new Date(row.last_scrape_at as string).toISOString()
        : null,
    };
  } catch (error) {
    console.error("[uae-sql] Failed to fetch stats:", error);
    return null;
  }
}

export interface TeamsPagePayload {
  title: string;
  url: string;
  summary?: string;
  matchedKeyword?: string;
}

async function fetchEInvoicingPagesFromSql(): Promise<TeamsPagePayload[]> {
  if (!sqlClient) return [];
  try {
    const rows = await sqlClient`
      SELECT title, url, summary, matched_keyword
      FROM uae_is_e_invoicing_pages
      ORDER BY scraped_at DESC
    ` as any[];
    return rows.map((row: any) => ({
      title: row.title as string,
      url: row.url as string,
      summary: row.summary as string | undefined,
      matchedKeyword: row.matched_keyword as string | undefined,
    }));
  } catch (error) {
    console.error("[uae-sql] Failed to fetch einvoicing pages:", error);
    return [];
  }
}

export async function getKnownUrlHashes(): Promise<Set<string>> {
  if (!isSupabaseEnabled || !supabase) {
    return new Set();
  }
  const rows = await selectAllIds();
  return new Set(rows.map((row) => row.id));
}

export async function fetchPersistedPages(): Promise<ScrapedPage[]> {
  if (isSupabaseEnabled && supabase) {
    // Fetch only e-invoicing pages from the dedicated table
    const { data, error } = await supabase
      .from(EINVOICING_COLLECTION)
      .select("id,url,title,content,scraped_at,summary,matched_keyword")
      .order("scraped_at", { ascending: false });

    if (error) {
      console.error("[supabase] Failed to fetch e-invoicing pages:", error);
    } else if (data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        content: row.content,
        scrapedAt: row.scraped_at,
        summary: row.summary,
        matchedKeyword: row.matched_keyword,
      }));
    }
  }

  return fetchPagesFromSql();
}

interface PersistPageInput extends InsertScrapedPage {
  isEInvoicing: boolean;
}

export async function savePageToCloud(
  page: PersistPageInput
): Promise<{ isNew: boolean }> {
  if (!isSupabaseEnabled || !supabase) {
    return { isNew: true };
  }

  const pageId = hashUrl(page.url);

  console.log(`[persistence] Saving page - isEInvoicing: ${page.isEInvoicing}, summary: "${page.summary?.substring(0, 50)}..."`);

  const { data: existing, error: selectError } = await supabase
    .from(PAGES_COLLECTION)
    .select("id")
    .eq("id", pageId)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    console.error("[supabase] Failed to check existing page:", selectError);
  }

  const { error: upsertError } = await supabase.from(PAGES_COLLECTION).upsert(
    {
      id: pageId,
      url: page.url,
      title: page.title,
      content: page.content,
      scraped_at: page.scrapedAt,
      is_e_invoicing: page.isEInvoicing,
      summary: page.summary || null,
      matched_keyword: page.matchedKeyword || null,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    console.error("[supabase] Failed to upsert page:", upsertError);
  }

  if (page.isEInvoicing) {
    const { error: einvoiceError } = await supabase
      .from(EINVOICING_COLLECTION)
      .upsert(
        {
          id: pageId,
          url: page.url,
          title: page.title,
          content: page.content,
          scraped_at: page.scrapedAt,
          summary: page.summary || null,
          matched_keyword: page.matchedKeyword || null,
        },
        { onConflict: "id" }
      );

    if (einvoiceError) {
      console.error("[supabase] Failed to upsert einvoicing page:", einvoiceError);
    }
  }

  return { isNew: !existing };
}

async function getSettingsRow(): Promise<AppSettings> {
  if (!isSupabaseEnabled || !supabase) return defaultSettings;

  const { data, error } = await supabase
    .from(SETTINGS_COLLECTION)
    .select("*")
    .eq("id", SETTINGS_DOC_ID)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[supabase] Failed to fetch settings:", error);
  }

  if (!data) {
    await supabase.from(SETTINGS_COLLECTION).upsert({
      id: SETTINGS_DOC_ID,
      auto_run_enabled: defaultSettings.autoRunEnabled,
      teams_webhook_url: defaultSettings.teamsWebhookUrl,
      last_auto_run_at: defaultSettings.lastAutoRunAt,
      last_manual_run_at: defaultSettings.lastManualRunAt,
    });
    return defaultSettings;
  }

  return {
    autoRunEnabled: data.auto_run_enabled,
    teamsWebhookUrl: data.teams_webhook_url,
    lastAutoRunAt: data.last_auto_run_at,
    lastManualRunAt: data.last_manual_run_at,
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  if (!isSupabaseEnabled || !supabase) {
    return defaultSettings;
  }
  return getSettingsRow();
}

export async function updateAppSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings> {
  if (!isSupabaseEnabled || !supabase) {
    return { ...defaultSettings, ...updates };
  }

  const current = await getSettingsRow();
  const next = { ...current, ...updates };

  const { error } = await supabase.from(SETTINGS_COLLECTION).upsert({
    id: SETTINGS_DOC_ID,
    auto_run_enabled: next.autoRunEnabled,
    teams_webhook_url: next.teamsWebhookUrl ?? null,
    last_auto_run_at: next.lastAutoRunAt ?? null,
    last_manual_run_at: next.lastManualRunAt ?? null,
  });

  if (error) {
    console.error("[supabase] Failed to update settings:", error);
  }

  return next;
}

interface ScrapeRunSummary {
  mode: "manual" | "auto";
  startedAt: string;
  completedAt: string;
  totalPagesCrawled: number;
  newEInvoicingPages: number;
}

export async function recordScrapeRun(summary: ScrapeRunSummary): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;

  const { error } = await supabase.from(RUNS_COLLECTION).insert({
    mode: summary.mode,
    started_at: summary.startedAt,
    completed_at: summary.completedAt,
    total_pages_crawled: summary.totalPagesCrawled,
    new_e_invoicing_pages: summary.newEInvoicingPages,
  });

  if (error) {
    console.error("[supabase] Failed to record scrape run:", error);
  }

  const timestampField =
    summary.mode === "auto" ? "lastAutoRunAt" : "lastManualRunAt";
  await updateAppSettings({ [timestampField]: summary.completedAt });
}

export async function clearAllCloudData(): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;

  const tables = [PAGES_COLLECTION, EINVOICING_COLLECTION, RUNS_COLLECTION];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "");
    if (error && error.code !== "PGRST116") {
      console.error(`[supabase] Failed to clear table ${table}:`, error);
    }
  }

  const currentSettings = await getAppSettings();
  await updateAppSettings({
    autoRunEnabled: currentSettings.autoRunEnabled,
    teamsWebhookUrl: currentSettings.teamsWebhookUrl ?? null,
    lastAutoRunAt: null,
    lastManualRunAt: null,
  });
}

export async function fetchAllEInvoicingPages(): Promise<TeamsPagePayload[]> {
  if (isSupabaseEnabled && supabase) {
  const { data, error } = await supabase
    .from(EINVOICING_COLLECTION)
      .select("title,url,summary,matched_keyword")
    .order("scraped_at", { ascending: false });

  if (error) {
    console.error("[supabase] Failed to fetch e-invoicing pages:", error);
    } else if (data && data.length > 0) {
      return data.map((row) => ({
      title: row.title,
      url: row.url,
        summary: row.summary,
        matchedKeyword: row.matched_keyword,
      }));
    }
  }

  return fetchEInvoicingPagesFromSql();
}

export async function fetchCloudStats(): Promise<CloudStats> {
  if (isSupabaseEnabled && supabase) {
  const [{ count: totalPages }, { count: einvoicingPages }] = await Promise.all([
    supabase
      .from(PAGES_COLLECTION)
      .select("id", { count: "exact", head: true }),
    supabase
      .from(EINVOICING_COLLECTION)
      .select("id", { count: "exact", head: true }),
  ]);

  const settings = await getSettingsRow();

  return {
    totalPages: totalPages ?? 0,
    einvoicingPages: einvoicingPages ?? 0,
    lastScrapeAt: settings.lastManualRunAt ?? settings.lastAutoRunAt ?? null,
    };
  }

  const fallback = await fetchStatsFromSql();
  if (fallback) {
    return fallback;
  }

  return {
    totalPages: 0,
    einvoicingPages: 0,
    lastScrapeAt: null,
  };
}

