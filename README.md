# Global E-Invoicing Monitor

A multi-country web scraping application that monitors e-invoicing updates from government websites across different countries.

## 🌍 Supported Countries

- 🇧🇪 **Belgium** - BOSA (https://bosa.belgium.be/)
- 🇦🇪 **UAE** - Ministry of Finance (https://mof.gov.ae/)
- 🇩🇪 **Germany** - Coming Soon

## ✨ Features

### Core Functionality
- 🔍 **Automated Web Scraping** - Daily scraping of government e-invoicing pages
- 🤖 **AI-Powered Summaries** - Mistral AI generates concise summaries
- 🔑 **Keyword Tracking** - Identifies and tracks matched keywords (English + Arabic)
- 📊 **Multi-Country Dashboard** - Separate dashboards for each country
- 🏠 **Unified Homepage** - Combined feed from all countries
- 📧 **Teams Notifications** - Microsoft Teams webhook integration
- 📥 **Excel Export** - Export data to Excel spreadsheets

### Technical Features
- ⚡ **Real-time Updates** - Auto-refresh every 30 seconds
- 🔄 **Incremental Scraping** - Only crawls new/undiscovered URLs
- 💾 **Cloud Persistence** - Supabase for data storage
- 🎯 **Smart Filtering** - Search, date range, and country filters
- 📄 **Pagination** - 20 posts per page with smart navigation
- 🎨 **Modern UI** - Responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account
- Mistral AI API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd BelgiumScraperReplit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
# See /supabase/migrations/README.md

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MISTRAL_API_KEY=your-mistral-api-key
```

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) folder:

### 🚀 Getting Started
- **[Quick Setup - GitHub Actions](./docs/QUICK_SETUP_GITHUB_ACTIONS.md)** - 4-step setup guide
- **[GitHub Actions Setup](./docs/GITHUB_ACTIONS_SETUP.md)** - Complete automation guide
- **[Migration Summary](./docs/MIGRATION_SUMMARY.md)** - Database setup

### 🔧 Implementation Guides
- **[Keyword Tracking Implementation](./docs/KEYWORD_TRACKING_IMPLEMENTATION.md)** - How keyword detection works
- **[Homepage Pagination](./docs/HOMEPAGE_PAGINATION_FIX.md)** - Pagination implementation
- **[Homepage - All Countries](./docs/HOMEPAGE_ALL_COUNTRIES_FIX.md)** - Multi-country feed

### 🇦🇪 UAE-Specific
- **[UAE E-Invoicing Pages Fix](./docs/UAE_EINVOICING_PAGES_FIX.md)** - Dashboard filtering
- **[UAE Matched Keyword Fix](./docs/UAE_MATCHED_KEYWORD_FIX.md)** - Keyword storage
- **[UAE UI Layout Fix](./docs/UAE_UI_LAYOUT_FIX.md)** - UI improvements

**[📖 View All Documentation](./docs/README.md)**

## 🏗️ Project Structure

```
BelgiumScraperReplit/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Dashboard pages
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utilities
├── server/                # Backend Node.js application
│   ├── scraper.ts         # Belgium scraper
│   ├── persistence.ts     # Belgium data persistence
│   ├── uae/              # UAE-specific modules
│   │   ├── scraper.ts
│   │   └── persistence.ts
│   └── integrations/     # External integrations
├── supabase/             # Database migrations
│   └── migrations/
├── docs/                 # 📚 Documentation
├── .github/
│   └── workflows/        # GitHub Actions
└── shared/               # Shared types and schemas
```

## 🔄 Automated Scraping

The project uses GitHub Actions to run scrapers daily at 10 PM UTC.

### Setup Steps:
1. Add GitHub secrets (Supabase + Mistral API keys)
2. Enable auto-run in dashboards
3. Push to GitHub
4. Enable GitHub Actions

**[📖 Full Setup Guide](./docs/QUICK_SETUP_GITHUB_ACTIONS.md)**

## 🎯 Usage

### Access Dashboards

- **Homepage**: `/` - View all countries' updates
- **Belgium Dashboard**: `/belgium` - Belgium-specific scraper
- **UAE Dashboard**: `/uae` - UAE-specific scraper

### Features Available

1. **Start Scraping** - Manually trigger scraper
2. **Auto-Run** - Enable scheduled scraping
3. **Search & Filter** - Find specific updates
4. **Export to Excel** - Download data
5. **Teams Notifications** - Configure webhook

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Wouter (routing)
- TanStack Query (data fetching)
- Shadcn/ui (components)

### Backend
- Node.js
- Express
- TypeScript
- Cheerio (web scraping)
- Axios (HTTP client)

### Database & Storage
- Supabase (PostgreSQL)
- Neon (PostgreSQL alternative)

### AI & Integrations
- Mistral AI (summarization)
- Microsoft Teams (notifications)

### DevOps
- GitHub Actions (automation)
- Vite (build tool)
- ESBuild (bundler)

## 📊 Database Schema

### Belgium Tables
- `belgium_page_cache` - All scraped pages
- `belgium_is_e_invoicing_pages` - E-invoicing pages only

### UAE Tables
- `uae_page_cache` - All scraped pages
- `uae_is_e_invoicing_pages` - E-invoicing pages only

### Shared Tables
- `settings` - Application settings (per country)
- `scrape_runs` - Scraping history (all countries)

**[📖 Full Database Documentation](./supabase/migrations/README.md)**

## 🔍 Keyword Detection

The scraper uses advanced pattern matching to identify e-invoicing content:

### English Keywords
- e-invoice, e-invoicing, electronic invoicing
- PEPPOL, UBL, XML invoice
- digital invoice, tax invoice

### Arabic Keywords (UAE)
- فاتورة إلكترونية (e-invoice)
- الفواتير الإلكترونية (e-invoices)
- نظام الفوترة الإلكترونية (e-invoicing system)

**[📖 Full Keyword Documentation](./docs/KEYWORD_TRACKING_IMPLEMENTATION.md)**

## 🧪 Testing

### Test Scrapers Locally

```bash
# Test Belgium scraper
npx tsx server/run-scraper.ts

# Test UAE scraper
npx tsx server/uae/run-scraper.ts
```

### Build for Production

```bash
npm run build
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Scraper not running | Enable auto-run toggle in dashboard |
| No results showing | Check GitHub Actions logs |
| Keywords not storing | Verify Supabase migrations ran |
| Teams notifications failing | Configure webhook on homepage |

**[📖 Full Troubleshooting Guide](./docs/GITHUB_ACTIONS_SETUP.md#troubleshooting)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add documentation in `/docs`
5. Submit a pull request

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

- **Mistral AI** - AI-powered summarization
- **Supabase** - Database and backend services
- **Shadcn/ui** - Beautiful UI components

## 📞 Support

- 📖 **Documentation**: [`/docs`](./docs)
- 🐛 **Issues**: [GitHub Issues](your-repo-url/issues)
- 💬 **Discussions**: [GitHub Discussions](your-repo-url/discussions)

---

**Built with ❤️ for tracking global e-invoicing developments**

