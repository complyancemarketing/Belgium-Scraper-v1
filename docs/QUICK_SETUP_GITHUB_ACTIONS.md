# Quick Setup Guide: GitHub Actions Auto-Run for UAE

## ✅ What's Been Done

I've set up GitHub Actions to automatically run both Belgium and UAE scrapers daily. Here's what was configured:

### Files Created/Updated:
1. ✅ `.github/workflows/daily-scraper.yml` - Updated to run both scrapers
2. ✅ `server/uae/run-scraper.ts` - New UAE scraper runner
3. ✅ `GITHUB_ACTIONS_SETUP.md` - Complete documentation

## 🚀 Quick Setup Steps

### Step 1: Add GitHub Secrets (One-Time Setup)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these 3 secrets:

| Secret Name | Where to Find It |
|-------------|------------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `MISTRAL_API_KEY` | Your Mistral AI API key |

### Step 2: Enable Auto-Run in Dashboards

**For Belgium:**
1. Open your app and go to `/belgium` dashboard
2. Toggle **"Enable Auto-Run"** ON

**For UAE:**
1. Go to `/uae` dashboard  
2. Toggle **"Enable Auto-Run"** ON

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Add UAE auto-run support with GitHub Actions"
git push origin main
```

### Step 4: Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**

## 🎯 That's It!

Your scrapers will now run automatically **every day at 10 PM UTC**.

## 📊 How to Check if It's Working

### View Workflow Runs:
1. Go to **Actions** tab on GitHub
2. See the latest run of "Daily E-Invoicing Scraper (All Countries)"
3. Click on it to see logs for both Belgium and UAE

### View Results:
1. Open your app homepage
2. Check "Recent E-Invoicing Updates" section
3. You should see new posts from both countries

## 🔧 Manual Testing

Test locally before the scheduled run:

```bash
# Test Belgium scraper
npx tsx server/run-scraper.ts

# Test UAE scraper
npx tsx server/uae/run-scraper.ts
```

## ⏰ Schedule Details

- **When**: Daily at 10:00 PM UTC
- **Order**: Belgium first, then UAE
- **Duration**: ~5-10 minutes total
- **What it does**:
  - Scrapes new e-invoicing pages
  - Generates AI summaries
  - Saves to Supabase
  - Sends Teams notifications

## 🔄 Manual Trigger

Don't want to wait? Run it now:

1. Go to **Actions** tab
2. Click **Daily E-Invoicing Scraper (All Countries)**
3. Click **Run workflow** → Select branch → **Run workflow**

## ⚠️ Important Notes

1. **Auto-Run Must Be Enabled**: If auto-run is disabled in a dashboard, that country's scraper will be skipped
2. **Teams Webhook**: Configure on homepage for notifications
3. **Supabase Tables**: Make sure you've run the migrations first
4. **API Limits**: Monitor your Mistral AI and Supabase usage

## 🐛 Troubleshooting

### Scraper Skipped?
→ Enable auto-run toggle in the dashboard

### No Results?
→ Check GitHub Actions logs for errors

### No Teams Notifications?
→ Configure Teams webhook on homepage

### Both Fail?
→ Verify GitHub secrets are set correctly

## 📚 Full Documentation

For detailed information, see `GITHUB_ACTIONS_SETUP.md`

## 🎉 Success Indicators

You'll know it's working when:
- ✅ GitHub Actions shows green checkmarks
- ✅ New posts appear on homepage
- ✅ Supabase tables have new entries
- ✅ Teams receives notifications (if configured)

