# Web Scraper Dashboard - Design Guidelines

## Design Approach: Material Design System
This is a utility-focused, data-heavy dashboard application. We'll use **Material Design** principles for its excellent handling of information-dense interfaces, clear component patterns, and proven usability for productivity tools.

Reference applications: Linear (for clean data presentation), Notion (for intuitive controls), Airtable (for table interactions)

## Layout System

**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 consistently (p-4, gap-6, m-8)

**Container Strategy**:
- Full-width dashboard with sidebar navigation (or top navigation bar)
- Main content area: max-w-7xl mx-auto px-6
- Card-based layout for different functional sections

**Grid Structure**:
- Single column layout for dashboard
- 2-column split: Controls panel (left/top) + Results table (main area)
- Table area takes 70-80% of viewport width when results are showing

## Typography Hierarchy

**Font Stack**: 
- Primary: Inter (Google Fonts) for all UI text
- Monospace: JetBrains Mono for URLs and technical data

**Hierarchy**:
- Page Title: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Table Headers: text-sm font-semibold uppercase tracking-wide
- Table Data: text-sm font-normal
- Captions/Labels: text-xs font-medium

## Component Library

### Dashboard Header
- Application title with icon (web scraper/spider icon from Heroicons)
- Subtitle explaining purpose: "UAE Ministry of Finance - E-invoicing Content Scraper"
- Action area with Excel export button (secondary, outline style)

### Control Panel Card
Elevated card containing:
- Target URL display (read-only input showing https://mof.gov.ae/en/home/)
- Large primary "Start Scraping" button with loading spinner state
- Status indicators section showing:
  - Pages crawled count (badge style)
  - E-invoicing pages found count (badge style)
  - Duplicate pages ignored count (badge style)
- Linear progress bar showing crawl completion percentage

### Results Data Table
Material Design data table with:
- Column headers: Page Title | URL | Preview Text | Actions
- Row hover states with subtle elevation
- Checkbox column for multi-select (for selective export)
- Sticky header when scrolling
- Empty state illustration when no results ("Start scraping to see results")
- Pagination controls at bottom (showing X of Y results)

### Action Buttons
- Primary button: "Start Scraping" (prominent, filled)
- Secondary button: "Export to Excel" (outline style)
- Icon buttons: Download per row, view full content
- All buttons use Material Design ripple effect on interaction

### Status Indicators
- Progress bar: Linear, showing percentage with animation
- Badges: Pill-shaped with counts (e.g., "142 pages crawled")
- Status chips: "Scraping in progress", "Completed", "Error" with appropriate semantic indicators

### Data Display Cards
Small metric cards in a row showing:
- Total pages crawled
- E-invoicing pages found
- Time elapsed
- Last scrape date/time

## Functional States

**Initial State**: 
- Empty table with illustration and "Get started" message
- Disabled export button
- Prominent "Start Scraping" button

**Active Scraping State**:
- Progress bar animating
- "Start Scraping" button changes to "Scraping..." with spinner, disabled
- Real-time counter updates as pages are found
- Results populate table incrementally

**Completed State**:
- Full results table populated
- Export button enabled
- Success message with summary statistics
- Option to "Scrape Again" (secondary button)

**Error State**:
- Error alert banner at top of control panel
- Error message with retry option
- Problematic URLs highlighted in results if applicable

## Animations
- Progress bar: smooth linear animation
- Table rows: subtle fade-in as they populate
- Loading spinner: standard Material Design circular spinner
- Button interactions: ripple effect only
- No decorative or scroll-based animations

## Accessibility
- Keyboard navigation for all interactive elements
- ARIA labels for status indicators and progress
- Screen reader announcements for scraping progress
- High contrast between text and backgrounds
- Focus indicators on all interactive elements

## No Images Needed
This is a functional dashboard - no hero images or decorative imagery required. Use iconography from Heroicons for:
- Document/page icons in table
- Download icon for export
- Spider/web icon for scraping action
- Status icons (check, warning, error)