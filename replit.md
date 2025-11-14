# UAE Ministry of Finance E-Invoicing Web Scraper

## Overview

This is a web scraper dashboard application designed to crawl the UAE Ministry of Finance website (mof.gov.ae) and extract e-invoicing related content. The application provides a Material Design-inspired interface for initiating scraping jobs, monitoring progress, and viewing/exporting results in a data-rich table format.

The system automatically identifies pages containing e-invoicing keywords (e-invoice, einvoicing, electronic invoice, etc.) and stores them for review and export to Excel format.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing (single-page application)

**UI Component System:**
- shadcn/ui component library with Radix UI primitives for accessible, composable components
- Tailwind CSS for utility-first styling with custom design tokens
- Material Design principles for information-dense dashboard layouts
- Typography: Inter for UI text, JetBrains Mono for technical content (URLs)

**State Management:**
- TanStack Query (React Query) for server state management with automatic refetching
- Real-time polling during scraping operations (1-2 second intervals)
- Local React state for UI-specific concerns (search filters, pagination, selections)

**Design System:**
- Card-based layout with elevated surfaces
- Consistent spacing using Tailwind units (2, 4, 6, 8)
- Custom color system with HSL values for theming support
- Responsive grid layouts optimized for data tables

### Backend Architecture

**Server Framework:**
- Express.js running on Node.js for HTTP server
- ESM module system throughout the codebase
- Middleware for JSON parsing and request logging

**API Design:**
- RESTful endpoints under `/api` prefix:
  - `GET /api/session` - Retrieve current scraping session status
  - `GET /api/pages` - Fetch all scraped pages
  - `POST /api/scrape/start` - Initiate new scraping job
- JSON request/response format
- Error handling with appropriate HTTP status codes

**Web Scraping Engine:**
- Axios for HTTP requests to target websites
- Cheerio for HTML parsing and DOM traversal
- Keyword-based content filtering (e-invoicing related terms)
- Configurable crawl limits (MAX_PAGES) and request delays to prevent rate limiting
- URL deduplication to avoid crawling the same page twice
- In-memory visited URL tracking using Sets

**Concurrency Control:**
- Single-scraping-job-at-a-time enforcement via boolean flag
- Asynchronous scraping operations running in background
- Session status tracking (idle, scraping, completed, error states)

### Data Storage

**Storage Strategy:**
- In-memory storage implementation (MemStorage class) using JavaScript Maps and Sets
- Session data stored as singleton object with status tracking
- Scraped pages stored in Map with UUID keys
- Visited URLs tracked in Set for O(1) lookup performance

**Database Preparation:**
- Drizzle ORM configured for PostgreSQL (via drizzle.config.ts)
- Schema definitions using Zod for runtime validation
- Migration system ready (migrations directory configured)
- Connection ready via DATABASE_URL environment variable
- Note: Currently using in-memory storage; database integration can be added by implementing the IStorage interface

**Data Models:**
- ScrapedPage: url, title, content, scrapedAt timestamp
- ScrapingSession: status, timestamps, counters (pages crawled, e-invoicing pages found, duplicates ignored)
- Zod schemas for type validation and safety

### External Dependencies

**Third-Party Services:**
- Target website: https://mof.gov.ae (UAE Ministry of Finance)
- No external APIs currently integrated
- SheetJS (xlsx) loaded dynamically via CDN for Excel export functionality

**Database:**
- Neon Database (PostgreSQL) configured via @neondatabase/serverless
- Connection pooling ready for production use
- Currently optional - system operates fully in-memory mode

**UI Libraries:**
- Radix UI primitives for 20+ accessible components (dialogs, dropdowns, tabs, etc.)
- Lucide React for iconography
- date-fns for date formatting and manipulation

**Development Tools:**
- TypeScript for static type checking
- tsx for running TypeScript files in development
- esbuild for production server bundling
- Replit-specific plugins for runtime error overlay and development banners

**Key Scraping Parameters:**
- Base URL: https://mof.gov.ae
- Starting point: https://mof.gov.ae/en/home/
- Maximum pages per session: 100
- Request delay: 500ms between requests
- E-invoicing keywords: 12 variations including "e-invoice", "einvoicing", "electronic invoice", "digital invoice", "tax invoice", "vat invoice"