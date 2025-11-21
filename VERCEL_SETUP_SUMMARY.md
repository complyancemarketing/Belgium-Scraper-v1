# Vercel Deployment - Quick Fix Summary

## 🔧 What Was Created

1. **`vercel.json`** - Vercel configuration file
2. **`api/index.ts`** - Serverless function handler
3. **`docs/VERCEL_DEPLOYMENT.md`** - Complete deployment guide

## ⚡ Quick Fix Steps

### 1. Install Required Package

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

### 2. Verify Files Exist

- ✅ `vercel.json` - Should be in root
- ✅ `api/index.ts` - Should exist
- ✅ `dist/public/` - Should contain built frontend

### 3. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-key
MISTRAL_API_KEY=your-key
NODE_ENV=production
```

### 4. Deploy

```bash
vercel --prod
```

Or push to GitHub (if connected to Vercel).

## 🐛 If Still Not Working

### Check Build Output

The build should create:
- `dist/public/` - Frontend files
- `dist/index.js` - Server bundle (not used in Vercel)

### Verify API Routes

Test an API endpoint:
```
https://your-app.vercel.app/api/session
```

Should return JSON, not HTML.

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Functions" tab
4. Check for errors

## 📝 Important Notes

1. **Scraping won't work on Vercel** - Use GitHub Actions instead
2. **Cron jobs removed** - They're in GitHub Actions now
3. **API routes only** - Long operations may timeout
4. **Static files** - Served from `dist/public/`

## 🔗 Full Documentation

See `docs/VERCEL_DEPLOYMENT.md` for complete guide.

