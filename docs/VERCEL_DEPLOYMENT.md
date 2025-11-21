# Vercel Deployment Guide

This guide explains how to deploy the Global E-Invoicing Monitor to Vercel.

## ⚠️ Important Note

Vercel is a serverless platform, which means:
- **Long-running processes** (like web scraping) may hit timeout limits
- **Background jobs** (cron) won't work - use GitHub Actions instead
- **API routes** need to be serverless functions

## 📋 Prerequisites

1. Vercel account (free tier works)
2. GitHub repository connected to Vercel
3. Environment variables configured

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### Step 2: Configure Vercel

The project includes:
- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless function handler

### Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `MISTRAL_API_KEY` | Mistral AI API key |
| `NODE_ENV` | `production` |

### Step 4: Deploy

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm install`
5. Add environment variables
6. Click "Deploy"

**Option B: Via CLI**
```bash
vercel
```

## ⚙️ Configuration Files

### `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/dist/public/$1"
    }
  ]
}
```

### `api/index.ts`

This file wraps your Express app as a Vercel serverless function.

## 🔧 Build Configuration

### Update `package.json` Scripts

Make sure your build script is correct:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

### Install Required Package

Add `@vercel/node` to your dependencies:

```bash
npm install @vercel/node
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "@vercel/node": "^3.0.0"
  }
}
```

## 🐛 Troubleshooting

### Issue: Only Frontend Code Visible

**Problem:** Vercel is only serving the frontend, API routes don't work.

**Solution:**
1. Check `vercel.json` configuration
2. Ensure `api/index.ts` exists
3. Verify `@vercel/node` is installed
4. Check build logs for errors

### Issue: API Routes Return 404

**Problem:** `/api/*` routes return 404.

**Solution:**
1. Verify `vercel.json` rewrites are correct
2. Check that `api/index.ts` exports default handler
3. Ensure routes are registered in Express app

### Issue: Build Fails

**Problem:** Build process fails on Vercel.

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles correctly
4. Check for missing environment variables

### Issue: Timeout Errors

**Problem:** Scraping operations timeout.

**Solution:**
- Vercel has a 10-second timeout for Hobby plan
- Use GitHub Actions for scraping instead
- API routes should be quick (< 5 seconds)

## 📝 Recommended Architecture

### For Vercel Deployment:

1. **Frontend Only on Vercel**
   - Deploy React app to Vercel
   - Fast, global CDN
   - Perfect for static assets

2. **API Routes on Vercel**
   - Simple CRUD operations
   - Data fetching
   - Quick responses (< 5 seconds)

3. **Scraping via GitHub Actions**
   - Long-running processes
   - Scheduled jobs
   - No timeout limits

### Alternative: Hybrid Approach

- **Vercel:** Frontend + API routes
- **GitHub Actions:** Scheduled scraping
- **Supabase:** Database

## 🔄 Migration from Replit

If you're migrating from Replit:

1. **Remove Replit-specific code:**
   - Remove `server/index.ts` server startup
   - Remove cron jobs (use GitHub Actions)
   - Update static file serving

2. **Update environment variables:**
   - Move from Replit secrets to Vercel env vars
   - Update `.env` file structure

3. **Test locally:**
   ```bash
   npm run build
   vercel dev
   ```

## 📊 Performance Considerations

### Vercel Limits (Hobby Plan):
- **Function execution:** 10 seconds
- **Build time:** 45 minutes
- **Bandwidth:** 100 GB/month

### Optimization Tips:
1. **Code splitting** - Reduce bundle size
2. **Caching** - Use Vercel's edge caching
3. **API optimization** - Keep responses fast
4. **Static assets** - Use CDN for images

## 🎯 Best Practices

1. **Separate Concerns:**
   - Frontend: Vercel
   - Scraping: GitHub Actions
   - Database: Supabase

2. **Environment Variables:**
   - Never commit secrets
   - Use Vercel's env var system
   - Different values for dev/prod

3. **Error Handling:**
   - Proper error responses
   - Logging for debugging
   - User-friendly messages

4. **Testing:**
   - Test locally with `vercel dev`
   - Test API routes individually
   - Verify environment variables

## 🔗 Related Documentation

- [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md) - For scraping automation
- [Quick Setup Guide](./QUICK_SETUP_GITHUB_ACTIONS.md) - Getting started
- [Vercel Documentation](https://vercel.com/docs) - Official docs

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Review error messages
3. Test API routes locally
4. Check environment variables
5. Review this guide's troubleshooting section

---

**Last Updated:** November 2025  
**Platform:** Vercel  
**Status:** Production Ready

