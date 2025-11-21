# Documentation

This folder contains all documentation for the Global E-Invoicing Monitor project.

## 📚 Table of Contents

### 🚀 Setup & Deployment

1. **[GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md)** - Complete guide for automated scraping
   - Detailed instructions for setting up GitHub Actions
   - Cron job configuration
   - Environment variables and secrets
   - Troubleshooting guide

2. **[Quick Setup - GitHub Actions](./QUICK_SETUP_GITHUB_ACTIONS.md)** - Fast start guide
   - 4-step quick setup
   - Essential configuration only
   - Perfect for getting started quickly

### 🇦🇪 UAE Scraper Implementation

3. **[UAE E-Invoicing Pages Fix](./UAE_EINVOICING_PAGES_FIX.md)**
   - Fixed dashboard to show only e-invoicing pages
   - Changed from showing all crawled pages to filtered results
   - Database query optimization

4. **[UAE Matched Keyword Fix](./UAE_MATCHED_KEYWORD_FIX.md)**
   - Implemented keyword tracking for UAE scraper
   - Fixed storage in Supabase
   - Complete data flow documentation

5. **[UAE UI Layout Fix](./UAE_UI_LAYOUT_FIX.md)**
   - Changed from table layout to accordion layout
   - Matches Belgium scraper UI
   - Improved mobile responsiveness

6. **[Keyword Tracking Implementation](./KEYWORD_TRACKING_IMPLEMENTATION.md)**
   - Enhanced keyword detection methodology
   - Multilingual support (English + Arabic)
   - Pattern matching algorithms
   - Database schema updates

### 🏠 Homepage Features

7. **[Homepage - All Countries Fix](./HOMEPAGE_ALL_COUNTRIES_FIX.md)**
   - Combined Belgium and UAE posts on homepage
   - Unified global feed
   - Country filtering

8. **[Homepage Pagination](./HOMEPAGE_PAGINATION_FIX.md)**
   - 20 posts per page
   - Smart page number display
   - Auto-reset on filter changes

### 📊 Database & Migration

9. **[Migration Summary](./MIGRATION_SUMMARY.md)**
   - Overview of all database changes
   - Supabase table structure
   - Migration history

## 🗂️ Documentation by Category

### For Developers

**Getting Started:**
- Start with [Quick Setup - GitHub Actions](./QUICK_SETUP_GITHUB_ACTIONS.md)
- Then read [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md) for details

**Understanding the Codebase:**
- [Keyword Tracking Implementation](./KEYWORD_TRACKING_IMPLEMENTATION.md) - How keyword detection works
- [UAE Matched Keyword Fix](./UAE_MATCHED_KEYWORD_FIX.md) - Data flow and storage
- [Migration Summary](./MIGRATION_SUMMARY.md) - Database structure

**UI/UX Changes:**
- [UAE UI Layout Fix](./UAE_UI_LAYOUT_FIX.md) - Frontend component changes
- [Homepage Pagination](./HOMEPAGE_PAGINATION_FIX.md) - Pagination implementation
- [Homepage - All Countries Fix](./HOMEPAGE_ALL_COUNTRIES_FIX.md) - Multi-country feed

### For DevOps/Deployment

**Essential Reading:**
1. [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md) - Automated deployment
2. [Quick Setup - GitHub Actions](./QUICK_SETUP_GITHUB_ACTIONS.md) - Fast deployment
3. [Migration Summary](./MIGRATION_SUMMARY.md) - Database setup

### For Troubleshooting

**Common Issues:**
- **Scraper not running?** → [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md) - Troubleshooting section
- **UAE showing all pages?** → [UAE E-Invoicing Pages Fix](./UAE_EINVOICING_PAGES_FIX.md)
- **Keywords not storing?** → [UAE Matched Keyword Fix](./UAE_MATCHED_KEYWORD_FIX.md)
- **UI layout issues?** → [UAE UI Layout Fix](./UAE_UI_LAYOUT_FIX.md)

## 📋 Quick Reference

### File Naming Convention

- `*_SETUP.md` - Setup and configuration guides
- `*_FIX.md` - Bug fixes and solutions
- `*_IMPLEMENTATION.md` - Feature implementations
- `QUICK_*.md` - Quick start guides

### Document Structure

Each document typically includes:
- **Issue/Feature Description** - What problem was solved
- **Root Cause** - Why the issue occurred
- **Changes Made** - Specific code changes
- **Testing Steps** - How to verify the fix
- **Build Status** - Compilation results

## 🔄 Recent Updates

**Latest Documentation (Nov 2025):**
1. GitHub Actions auto-run for UAE scraper
2. Homepage pagination (20 posts per page)
3. Multi-country homepage feed
4. Enhanced keyword tracking with Arabic support

## 📝 Contributing to Documentation

When adding new documentation:
1. Place it in the `docs/` folder
2. Follow the naming convention
3. Update this README.md with a link
4. Include practical examples and code snippets
5. Add troubleshooting sections where applicable

## 🔗 Related Documentation

**In Other Folders:**
- `/supabase/migrations/README.md` - Supabase migration guide
- `/supabase/migrations/README_UAE.md` - UAE-specific database setup
- `/.github/workflows/daily-scraper.yml` - GitHub Actions workflow file

## 📞 Support

For issues or questions:
1. Check the relevant documentation above
2. Review troubleshooting sections
3. Check GitHub Actions logs (for deployment issues)
4. Review Supabase logs (for database issues)

## 🎯 Quick Links by Task

**I want to...**

- **Set up automated scraping** → [Quick Setup - GitHub Actions](./QUICK_SETUP_GITHUB_ACTIONS.md)
- **Understand keyword detection** → [Keyword Tracking Implementation](./KEYWORD_TRACKING_IMPLEMENTATION.md)
- **Fix UAE dashboard issues** → [UAE E-Invoicing Pages Fix](./UAE_EINVOICING_PAGES_FIX.md)
- **Add pagination** → [Homepage Pagination](./HOMEPAGE_PAGINATION_FIX.md)
- **Set up database** → [Migration Summary](./MIGRATION_SUMMARY.md)
- **Troubleshoot scrapers** → [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md) (Troubleshooting section)

---

**Last Updated:** November 2025  
**Project:** Global E-Invoicing Monitor  
**Countries Supported:** Belgium 🇧🇪, UAE 🇦🇪

