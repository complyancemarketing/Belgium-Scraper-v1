# Documentation Organization

This document explains how the project documentation is organized.

## 📁 Folder Structure

```
BelgiumScraperReplit/
├── README.md                          # Main project README
├── docs/                              # 📚 All documentation
│   ├── README.md                      # Documentation index
│   ├── GITHUB_ACTIONS_SETUP.md        # Automation setup
│   ├── QUICK_SETUP_GITHUB_ACTIONS.md  # Quick start guide
│   ├── KEYWORD_TRACKING_IMPLEMENTATION.md
│   ├── HOMEPAGE_ALL_COUNTRIES_FIX.md
│   ├── HOMEPAGE_PAGINATION_FIX.md
│   ├── UAE_EINVOICING_PAGES_FIX.md
│   ├── UAE_MATCHED_KEYWORD_FIX.md
│   ├── UAE_UI_LAYOUT_FIX.md
│   └── MIGRATION_SUMMARY.md
├── supabase/
│   └── migrations/
│       ├── README.md                  # Supabase setup
│       └── README_UAE.md              # UAE database setup
└── .github/
    └── workflows/
        └── daily-scraper.yml          # GitHub Actions workflow
```

## 📚 Documentation Types

### 1. **Setup Guides** (Getting Started)
- `README.md` - Main project overview
- `docs/QUICK_SETUP_GITHUB_ACTIONS.md` - Fast setup (4 steps)
- `docs/GITHUB_ACTIONS_SETUP.md` - Detailed automation guide
- `supabase/migrations/README.md` - Database setup

### 2. **Implementation Guides** (How Things Work)
- `docs/KEYWORD_TRACKING_IMPLEMENTATION.md` - Keyword detection system
- `docs/HOMEPAGE_PAGINATION_FIX.md` - Pagination feature
- `docs/HOMEPAGE_ALL_COUNTRIES_FIX.md` - Multi-country feed

### 3. **Fix Documentation** (Problem Solutions)
- `docs/UAE_EINVOICING_PAGES_FIX.md` - Dashboard filtering fix
- `docs/UAE_MATCHED_KEYWORD_FIX.md` - Keyword storage fix
- `docs/UAE_UI_LAYOUT_FIX.md` - UI layout improvements

### 4. **Reference Documentation** (Database & Schema)
- `docs/MIGRATION_SUMMARY.md` - Database changes overview
- `supabase/migrations/README_UAE.md` - UAE database details

## 🗺️ Documentation Navigation

### For New Users
**Start Here:**
1. `/README.md` - Project overview
2. `docs/QUICK_SETUP_GITHUB_ACTIONS.md` - Get running fast
3. `supabase/migrations/README.md` - Set up database

### For Developers
**Understanding the Code:**
1. `docs/README.md` - Documentation index
2. `docs/KEYWORD_TRACKING_IMPLEMENTATION.md` - Core feature
3. `docs/UAE_MATCHED_KEYWORD_FIX.md` - Data flow example
4. `docs/MIGRATION_SUMMARY.md` - Database structure

### For DevOps
**Deployment:**
1. `docs/GITHUB_ACTIONS_SETUP.md` - Automation
2. `supabase/migrations/README.md` - Database
3. `.github/workflows/daily-scraper.yml` - Workflow config

### For Troubleshooting
**Common Issues:**
- Check `docs/GITHUB_ACTIONS_SETUP.md` (Troubleshooting section)
- Check specific fix docs (UAE_*_FIX.md files)
- Check `/README.md` (Troubleshooting section)

## 📖 Document Naming Convention

### Prefixes
- `QUICK_*` - Quick start guides
- `*_SETUP` - Setup and configuration
- `*_FIX` - Bug fixes and solutions
- `*_IMPLEMENTATION` - Feature implementations

### Suffixes
- `*.md` - Markdown documentation
- `README.md` - Index or overview files

## 🎯 Quick Reference

### I want to...

| Task | Document |
|------|----------|
| Get started quickly | `docs/QUICK_SETUP_GITHUB_ACTIONS.md` |
| Set up automation | `docs/GITHUB_ACTIONS_SETUP.md` |
| Set up database | `supabase/migrations/README.md` |
| Understand keywords | `docs/KEYWORD_TRACKING_IMPLEMENTATION.md` |
| Fix UAE issues | `docs/UAE_*_FIX.md` files |
| Add pagination | `docs/HOMEPAGE_PAGINATION_FIX.md` |
| View all docs | `docs/README.md` |

## 📝 Document Structure

Each documentation file typically includes:

1. **Title & Overview** - What the document covers
2. **Issue/Feature Description** - Problem or feature being addressed
3. **Root Cause** (for fixes) - Why the issue occurred
4. **Changes Made** - Specific code changes with examples
5. **Code Examples** - Before/after comparisons
6. **Testing Steps** - How to verify
7. **Troubleshooting** - Common issues
8. **Build Status** - Compilation results

## 🔄 Maintenance

### Adding New Documentation

1. **Create the file** in `/docs` folder
2. **Follow naming convention** (see above)
3. **Update** `docs/README.md` with link
4. **Update** main `README.md` if major feature
5. **Include examples** and code snippets
6. **Add troubleshooting** section

### Updating Existing Documentation

1. **Update the file** with new information
2. **Add date** to "Last Updated" section
3. **Update** `docs/README.md` if structure changed
4. **Test** all code examples still work

## 🔗 External References

### Related Documentation
- GitHub Actions: https://docs.github.com/en/actions
- Supabase: https://supabase.com/docs
- Mistral AI: https://docs.mistral.ai/

### Project-Specific
- Workflow file: `.github/workflows/daily-scraper.yml`
- Database migrations: `supabase/migrations/`
- Scraper code: `server/scraper.ts`, `server/uae/scraper.ts`

## 📊 Documentation Statistics

**Total Documents:** 13
- Setup Guides: 3
- Implementation Guides: 3
- Fix Documentation: 3
- Reference Documentation: 2
- Index Files: 2

**Categories:**
- GitHub Actions: 2 docs
- Homepage Features: 2 docs
- UAE Scraper: 3 docs
- Database: 2 docs
- Keywords: 1 doc
- General: 3 docs

## 🎨 Best Practices

### Writing Documentation

1. **Be Clear** - Use simple language
2. **Be Specific** - Include exact commands and paths
3. **Use Examples** - Show before/after code
4. **Add Visuals** - Use ASCII art for diagrams
5. **Include Troubleshooting** - Anticipate issues
6. **Test Everything** - Verify all commands work

### Organizing Documentation

1. **Group by Purpose** - Setup, Implementation, Fixes
2. **Use Consistent Naming** - Follow conventions
3. **Cross-Reference** - Link related documents
4. **Keep Updated** - Review regularly
5. **Index Everything** - Update README.md files

## 🚀 Future Additions

When adding new countries or features:

1. Create feature documentation in `/docs`
2. Update `docs/README.md` index
3. Update main `README.md` if major
4. Add database migration docs if needed
5. Update troubleshooting sections

## 📞 Documentation Support

For questions about documentation:
1. Check `docs/README.md` for overview
2. Check specific document for details
3. Review examples and code snippets
4. Check troubleshooting sections

---

**Last Updated:** November 2025  
**Maintained By:** Development Team  
**Location:** `/docs` folder

