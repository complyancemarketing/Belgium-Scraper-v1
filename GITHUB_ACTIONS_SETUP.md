# GitHub Actions Scheduled Scraper Setup

This project uses GitHub Actions to run the Belgium e-invoicing scraper daily at 10:00 PM.

## Setup Instructions

### 1. Add GitHub Secrets

Go to your repository on GitHub:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these three secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Found in Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Found in Supabase Dashboard → Settings → API (keep secret!) |
| `MISTRAL_API_KEY` | `HuLcVk8CUn31ea55tNzco4JQmJ0RhaVP` | Your Mistral AI API key |

### 2. Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**

### 3. Schedule Configuration

The scraper runs automatically:
- **Schedule**: Daily at 10:00 PM UTC
- **Workflow file**: `.github/workflows/daily-scraper.yml`

To adjust the timezone:
- Edit `.github/workflows/daily-scraper.yml`
- Modify the cron expression: `'0 22 * * *'`
- Format: `minute hour day month day-of-week`
- Example for 10 PM EST (3 AM UTC): `'0 3 * * *'`

### 4. Manual Trigger

You can also run the scraper manually:
1. Go to **Actions** tab
2. Click **Daily E-Invoicing Scraper** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

### 5. View Logs

To see scraper execution logs:
1. Go to **Actions** tab
2. Click on any workflow run
3. Click on the **scrape** job to see detailed logs

## How It Works

1. **GitHub Actions** triggers at 10 PM daily
2. Sets up Node.js environment and installs dependencies
3. Runs `server/run-scraper.ts` with environment variables
4. Scraper fetches pages from https://bosa.belgium.be/
5. AI summarizes e-invoicing content using Mistral AI
6. Saves results to Supabase
7. Sends notifications to Teams webhook (if configured)

## Testing Locally

To test the scraper script locally:

```bash
# Make sure environment variables are set in .env
npm install
npx tsx server/run-scraper.ts
```

## Troubleshooting

**Workflow not running?**
- Check if GitHub Actions is enabled in repository settings
- Verify the cron schedule is correct
- Check if secrets are properly configured

**Scraper failing?**
- View the workflow logs in the Actions tab
- Verify all three secrets are set correctly
- Check Supabase and Mistral API quotas/limits

**No Teams notifications?**
- Ensure Teams webhook URL is saved in the app's homepage
- Check if the webhook URL is still valid in Microsoft Teams
