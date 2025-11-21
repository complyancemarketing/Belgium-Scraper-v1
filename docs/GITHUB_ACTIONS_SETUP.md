# GitHub Actions Scheduled Scraper Setup

This project uses GitHub Actions to run both Belgium and UAE e-invoicing scrapers daily at 10:00 PM UTC.

## Setup Instructions

### 1. Add GitHub Secrets

Go to your repository on GitHub:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these three secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Found in Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Found in Supabase Dashboard → Settings → API (keep secret!) |
| `MISTRAL_API_KEY` | Your Mistral AI API key | Used for AI-powered content summarization |

**Important:** Never commit these secrets to your repository!

### 2. Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**

### 3. Schedule Configuration

The scrapers run automatically:
- **Schedule**: Daily at 10:00 PM UTC
- **Workflow file**: `.github/workflows/daily-scraper.yml`
- **Execution order**: Belgium first, then UAE

To adjust the timezone:
- Edit `.github/workflows/daily-scraper.yml`
- Modify the cron expression: `'0 22 * * *'`
- Format: `minute hour day month day-of-week`
- Example for 10 PM EST (3 AM UTC): `'0 3 * * *'`

**Common Timezone Examples:**
```yaml
# 10 PM UTC (default)
- cron: '0 22 * * *'

# 10 PM EST (3 AM UTC next day)
- cron: '0 3 * * *'

# 10 PM PST (6 AM UTC next day)
- cron: '0 6 * * *'

# 10 PM CET (9 PM UTC)
- cron: '0 21 * * *'

# 10 PM GST/UAE Time (6 PM UTC)
- cron: '0 18 * * *'
```

### 4. Enable Auto-Run in Dashboards

For scrapers to run automatically, you must enable auto-run in each dashboard:

**Belgium:**
1. Navigate to Belgium dashboard (`/belgium`)
2. Toggle **"Enable Auto-Run"** switch
3. This allows the GitHub Action to run the Belgium scraper

**UAE:**
1. Navigate to UAE dashboard (`/uae`)
2. Toggle **"Enable Auto-Run"** switch
3. This allows the GitHub Action to run the UAE scraper

**Note:** If auto-run is disabled, the GitHub Action will skip that country's scraper.

### 5. Manual Trigger

You can also run the scrapers manually:
1. Go to **Actions** tab
2. Click **Daily E-Invoicing Scraper (All Countries)** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

This will run both Belgium and UAE scrapers immediately.

### 6. View Logs

To see scraper execution logs:
1. Go to **Actions** tab
2. Click on any workflow run
3. You'll see two jobs:
   - **scrape-belgium** - Belgium scraper logs
   - **scrape-uae** - UAE scraper logs
4. Click on each job to see detailed logs

## How It Works

### Workflow Execution

1. **GitHub Actions** triggers at 10 PM UTC daily
2. **Belgium Scraper Job** runs first:
   - Sets up Node.js environment
   - Installs dependencies
   - Runs `server/run-scraper.ts`
   - Checks if auto-run is enabled for Belgium
   - Scrapes https://bosa.belgium.be/
   - AI summarizes e-invoicing content
   - Saves to Supabase (`belgium_*` tables)
   - Sends Teams notification (if configured)

3. **UAE Scraper Job** runs after Belgium completes:
   - Sets up Node.js environment
   - Installs dependencies
   - Runs `server/uae/run-scraper.ts`
   - Checks if auto-run is enabled for UAE
   - Scrapes https://mof.gov.ae/
   - AI summarizes e-invoicing content
   - Saves to Supabase (`uae_*` tables)
   - Sends Teams notification using global webhook

### Data Flow

```
GitHub Actions (Cron: 10 PM UTC)
    ↓
┌─────────────────────────────────────┐
│ Job 1: Belgium Scraper              │
│ - Check auto-run enabled            │
│ - Scrape bosa.belgium.be            │
│ - AI summarize with Mistral         │
│ - Save to belgium_* tables          │
│ - Send Teams notification           │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Job 2: UAE Scraper                  │
│ - Check auto-run enabled            │
│ - Scrape mof.gov.ae                 │
│ - AI summarize with Mistral         │
│ - Save to uae_* tables              │
│ - Send Teams notification           │
└─────────────────────────────────────┘
```

## Testing Locally

To test the scraper scripts locally:

### Belgium Scraper
```bash
# Make sure environment variables are set in .env
npm install
npx tsx server/run-scraper.ts
```

### UAE Scraper
```bash
# Make sure environment variables are set in .env
npm install
npx tsx server/uae/run-scraper.ts
```

### Test Both
```bash
# Run Belgium first
npx tsx server/run-scraper.ts

# Then run UAE
npx tsx server/uae/run-scraper.ts
```

## Environment Variables Required

Create a `.env` file in the project root with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MISTRAL_API_KEY=your-mistral-api-key
```

## Troubleshooting

### Workflow not running?
- ✅ Check if GitHub Actions is enabled in repository settings
- ✅ Verify the cron schedule is correct
- ✅ Check if secrets are properly configured
- ✅ Ensure repository is not private (or has Actions enabled)

### Belgium scraper skipped?
- ✅ Check if auto-run is enabled in Belgium dashboard
- ✅ View workflow logs to see the skip message
- ✅ Enable auto-run toggle in `/belgium` dashboard

### UAE scraper skipped?
- ✅ Check if auto-run is enabled in UAE dashboard
- ✅ View workflow logs to see the skip message
- ✅ Enable auto-run toggle in `/uae` dashboard

### Scraper failing?
- ✅ View the workflow logs in the Actions tab
- ✅ Verify all three secrets are set correctly
- ✅ Check Supabase and Mistral API quotas/limits
- ✅ Verify database tables exist (run migrations)
- ✅ Check if target websites are accessible

### No Teams notifications?
- ✅ Ensure Teams webhook URL is saved on the homepage
- ✅ Check if the webhook URL is still valid in Microsoft Teams
- ✅ Verify auto-run is enabled for the country
- ✅ Check workflow logs for notification errors

### UAE scraper runs but Belgium doesn't?
- ✅ Check Belgium auto-run toggle
- ✅ Belgium job runs first - if it fails, UAE still runs
- ✅ View Belgium job logs for error details

### Both scrapers fail?
- ✅ Check if secrets are correctly configured
- ✅ Verify Supabase connection
- ✅ Check Mistral API key validity
- ✅ Review workflow logs for specific errors

## Workflow Features

### Sequential Execution
- Belgium scraper runs first
- UAE scraper runs only after Belgium completes
- If Belgium fails, UAE still runs (`needs: scrape-belgium` with default behavior)

### Independent Auto-Run Controls
- Each country has its own auto-run toggle
- Belgium can be enabled while UAE is disabled (or vice versa)
- Scrapers check their own settings before running

### Shared Resources
- Both use the same Supabase instance
- Both use the same Mistral API key
- UAE uses global Teams webhook (configured on homepage)
- Separate database tables prevent data conflicts

### Error Handling
- Each job logs errors independently
- Failed jobs don't prevent other jobs from running
- Detailed error messages in workflow logs

## Monitoring

### Check Last Run
1. Go to **Actions** tab
2. See latest workflow run status (✅ success or ❌ failed)
3. Click on run to see detailed logs

### View Results
1. Open your application homepage
2. Check "Recent E-Invoicing Updates" section
3. Filter by country to see results from each scraper

### Supabase Data
Check your Supabase dashboard:
- `belgium_is_e_invoicing_pages` - Belgium results
- `uae_is_e_invoicing_pages` - UAE results
- `scrape_runs` - Execution history for both countries

## Best Practices

1. **Test Locally First**: Always test scrapers locally before relying on GitHub Actions
2. **Monitor Quotas**: Keep an eye on Supabase and Mistral API usage
3. **Check Logs**: Review workflow logs regularly for issues
4. **Update Secrets**: Rotate API keys periodically for security
5. **Enable Auto-Run**: Remember to enable auto-run toggles in dashboards
6. **Teams Webhook**: Configure global Teams webhook on homepage for notifications

## Adding More Countries

To add another country (e.g., Germany):

1. Create `server/germany/run-scraper.ts`
2. Add new job in `.github/workflows/daily-scraper.yml`:
```yaml
scrape-germany:
  runs-on: ubuntu-latest
  needs: scrape-uae  # Run after UAE
  steps:
    # ... same steps as UAE but run server/germany/run-scraper.ts
```
3. Enable auto-run in Germany dashboard
4. Test locally first!
