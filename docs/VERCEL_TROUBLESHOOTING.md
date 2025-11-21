# Vercel Deployment Troubleshooting

## Common Issues and Solutions

### Issue: 500 Error - FUNCTION_INVOCATION_FAILED

**Symptoms:**
- API routes return 500 errors
- Stats show zero
- Error message: "FUNCTION_INVOCATION_FAILED"

**Possible Causes:**

#### 1. Missing Environment Variables

**Check:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Verify all required variables are set:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MISTRAL_API_KEY`
  - `NODE_ENV=production`

**Solution:**
- Add missing environment variables
- Redeploy after adding variables

#### 2. Missing @vercel/node Package

**Check:**
```bash
npm list @vercel/node
```

**Solution:**
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

#### 3. Build Errors

**Check:**
- Vercel Dashboard → Deployments → Click on failed deployment
- Check "Build Logs" tab

**Common Build Errors:**
- TypeScript compilation errors
- Missing dependencies
- Import path issues

**Solution:**
- Fix TypeScript errors
- Ensure all dependencies are in `package.json`
- Check import paths are correct

#### 4. Route Registration Failing

**Check:**
- Vercel Dashboard → Functions tab
- Check function logs for errors

**Solution:**
- Check `api/index.ts` exists
- Verify `registerRoutes` function works
- Check for async/await issues

### Issue: Stats Show Zero

**Symptoms:**
- Dashboard shows 0 for all stats
- No error messages visible

**Possible Causes:**

#### 1. Supabase Not Connected

**Check:**
- Environment variables set correctly
- Supabase tables exist
- Service role key is valid

**Solution:**
- Verify Supabase connection
- Check `isSupabaseEnabled` is true
- Test Supabase connection locally

#### 2. Database Tables Empty

**Check:**
- Supabase Dashboard → Table Editor
- Check if tables have data

**Solution:**
- Run scraper to populate data
- Or use GitHub Actions to scrape

#### 3. API Routes Not Working

**Check:**
- Test API endpoint: `https://your-app.vercel.app/api/stats`
- Should return JSON, not HTML

**Solution:**
- Check `vercel.json` routing
- Verify `api/index.ts` handler
- Check function logs

### Issue: Routes Return 404

**Symptoms:**
- API calls return 404
- Routes not found

**Solution:**
1. Check `vercel.json` rewrites:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

2. Verify `api/index.ts` exists
3. Check route paths match exactly

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls blocked

**Solution:**
- CORS headers are already in `api/index.ts`
- Check `vercel.json` headers configuration
- Verify headers are being set

## Debugging Steps

### 1. Check Function Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Functions" tab
4. Click on a function execution
5. Check logs for errors

### 2. Test API Endpoints

Test these endpoints directly:

```bash
# Test stats endpoint
curl https://your-app.vercel.app/api/stats

# Test session endpoint
curl https://your-app.vercel.app/api/session

# Test UAE stats
curl https://your-app.vercel.app/api/uae/stats
```

### 3. Check Environment Variables

```bash
# In Vercel Dashboard
Settings → Environment Variables

# Verify:
- SUPABASE_URL is set
- SUPABASE_SERVICE_ROLE_KEY is set
- MISTRAL_API_KEY is set
- NODE_ENV=production
```

### 4. Local Testing

Test the API handler locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Test endpoints
curl http://localhost:3000/api/stats
```

### 5. Check Build Output

Verify build creates correct files:

```bash
npm run build

# Should create:
# - dist/public/ (frontend)
# - dist/index.js (server bundle, not used in Vercel)
```

## Quick Fixes

### Fix 1: Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

### Fix 2: Clear Vercel Cache

1. Vercel Dashboard → Project Settings
2. Go to "Build & Development Settings"
3. Clear build cache
4. Redeploy

### Fix 3: Check Package.json

Ensure these are in `package.json`:

```json
{
  "dependencies": {
    "@vercel/node": "^3.0.0",
    "express": "^4.21.2"
  }
}
```

### Fix 4: Verify File Structure

```
project-root/
├── api/
│   └── index.ts          ← Must exist
├── vercel.json           ← Must exist
├── dist/
│   └── public/          ← Frontend build
└── server/
    └── routes.ts        ← API routes
```

## Testing Checklist

- [ ] `@vercel/node` is installed
- [ ] `api/index.ts` exists and exports default handler
- [ ] `vercel.json` has correct rewrites
- [ ] Environment variables are set in Vercel
- [ ] Build completes successfully
- [ ] Function logs show no errors
- [ ] API endpoints return JSON (not HTML)
- [ ] Supabase connection works
- [ ] Database tables exist

## Getting Help

If issues persist:

1. **Check Vercel Logs:**
   - Functions tab → View logs
   - Look for error messages

2. **Test Locally:**
   ```bash
   vercel dev
   ```

3. **Check GitHub Actions:**
   - Scraping should work via GitHub Actions
   - Not via Vercel (timeout limits)

4. **Review Documentation:**
   - `docs/VERCEL_DEPLOYMENT.md`
   - `VERCEL_SETUP_SUMMARY.md`

## Common Error Messages

### "Cannot find module"
- **Fix:** Install missing package
- **Check:** `package.json` dependencies

### "Function timeout"
- **Fix:** Scraping should use GitHub Actions
- **Note:** Vercel has 10-second limit

### "Environment variable not found"
- **Fix:** Add to Vercel Dashboard
- **Check:** Variable names match exactly

### "Route not found"
- **Fix:** Check `vercel.json` rewrites
- **Verify:** Route paths in `routes.ts`

---

**Last Updated:** November 2025  
**Platform:** Vercel

