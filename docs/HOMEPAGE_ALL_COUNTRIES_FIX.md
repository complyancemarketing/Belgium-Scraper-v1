# Homepage - Show All Countries E-Invoicing Updates

## Issue
The homepage's "Recent E-Invoicing Updates" section was only showing Belgium e-invoicing posts, not posts from all countries (Belgium + UAE).

## Root Cause
The homepage was only fetching data from the Belgium API endpoint (`/api/pages`) and not from the UAE endpoint (`/api/uae/pages`).

## Fix Applied

### File: `client/src/pages/home.tsx`

#### 1. Added UAE Pages Fetch

**Before:**
```typescript
// Fetch Belgium pages
const { data: belgiumPages = [] } = useQuery<ScrapedPage[]>({
  queryKey: ['/api/pages'],
  refetchInterval: 30000,
});

// Fetch settings for Teams webhook
const { data: settings, isLoading: settingsLoading } = useQuery<AppSettings>({
  queryKey: ['/api/settings'],
});
```

**After:**
```typescript
// Fetch Belgium pages
const { data: belgiumPages = [] } = useQuery<ScrapedPage[]>({
  queryKey: ['/api/pages'],
  refetchInterval: 30000,
});

// Fetch UAE pages
const { data: uaePages = [] } = useQuery<ScrapedPage[]>({
  queryKey: ['/api/uae/pages'],
  refetchInterval: 30000,
});

// Fetch settings for Teams webhook
const { data: settings, isLoading: settingsLoading } = useQuery<AppSettings>({
  queryKey: ['/api/settings'],
});
```

#### 2. Combined Pages from All Countries

**Before:**
```typescript
// Combine all country pages (for now just Belgium)
const allPages: CountryPage[] = belgiumPages.map(page => ({
  ...page,
  country: "Belgium",
  countryCode: "belgium"
}));
```

**After:**
```typescript
// Combine all country pages
const allPages: CountryPage[] = [
  ...belgiumPages.map(page => ({
    ...page,
    country: "Belgium",
    countryCode: "belgium"
  })),
  ...uaePages.map(page => ({
    ...page,
    country: "UAE",
    countryCode: "uae"
  }))
];
```

#### 3. Added UAE to Country Filter Dropdown

**Before:**
```typescript
<SelectContent>
  <SelectItem value="all">All Countries</SelectItem>
  <SelectItem value="belgium">🇧🇪 Belgium</SelectItem>
</SelectContent>
```

**After:**
```typescript
<SelectContent>
  <SelectItem value="all">All Countries</SelectItem>
  <SelectItem value="belgium">🇧🇪 Belgium</SelectItem>
  <SelectItem value="uae">🇦🇪 UAE</SelectItem>
</SelectContent>
```

## Features

### 1. Multi-Country Data Fetching
- ✅ Fetches Belgium e-invoicing pages from `/api/pages`
- ✅ Fetches UAE e-invoicing pages from `/api/uae/pages`
- ✅ Auto-refreshes every 30 seconds for both countries
- ✅ Combines all pages into a unified feed

### 2. Country Badges
Each update shows a country badge:
- 🇧🇪 **Belgium** - for Belgium posts
- 🇦🇪 **UAE** - for UAE posts

### 3. Country Filtering
Users can filter updates by:
- **All Countries** - Shows all e-invoicing updates
- **🇧🇪 Belgium** - Shows only Belgium updates
- **🇦🇪 UAE** - Shows only UAE updates

### 4. Unified Timeline
All updates are sorted by date (newest first) regardless of country, creating a unified timeline of global e-invoicing updates.

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Homepage Component                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  useQuery('/api/pages')      → Belgium Pages               │
│  useQuery('/api/uae/pages')  → UAE Pages                   │
│                                                             │
│  ↓                                                          │
│  Combine & Tag with Country                                │
│  ↓                                                          │
│  Filter by:                                                 │
│    - Search query                                           │
│    - Date range                                             │
│    - Country                                                │
│  ↓                                                          │
│  Sort by date (newest first)                                │
│  ↓                                                          │
│  Display in unified feed                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Example Display

```
┌─────────────────────────────────────────────────────────────┐
│ Recent E-Invoicing Updates                                  │
├─────────────────────────────────────────────────────────────┤
│ [Search: _______________]                                   │
│ Date Range: [All Time ▼]  Country: [All Countries ▼]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Belgium] 📅 Nov 19, 2025, 11:42 AM                    │ │
│ │ Jaarrekening van de federale staat | BOSA              │ │
│ │ The Federal State's Annual Accounts...                 │ │
│ │ 🔗 https://bosa.belgium.be/...                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [UAE] 📅 Nov 21, 2025, 10:30 AM                        │ │
│ │ Ministry of Finance Announces...                       │ │
│ │ This page discusses the Ministry of Finance...         │ │
│ │ 🔗 https://mof.gov.ae/...                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Belgium] 📅 Nov 19, 2025, 11:41 AM                    │ │
│ │ Comparaison des marchés 2021 | BOSA                   │ │
│ │ The BOSA 2021 Comparative Market Study...              │ │
│ │ 🔗 https://bosa.belgium.be/...                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Filtering Examples

### Filter by Country: UAE
```
Country: [🇦🇪 UAE ▼]

Results:
- [UAE] Ministry of Finance Announces...
- [UAE] وزارة المالية تعلن...
```

### Filter by Date: Last 7 Days
```
Date Range: [Last 7 Days ▼]

Results:
- [UAE] Ministry of Finance... (2 days ago)
- [Belgium] Jaarrekening... (3 days ago)
```

### Search: "invoice"
```
Search: invoice

Results:
- [Belgium] ...e-invoicing roadmap...
- [UAE] ...electronic invoice system...
```

## Scalability

The implementation is designed to easily add more countries:

```typescript
// To add Germany in the future:
const { data: germanyPages = [] } = useQuery<ScrapedPage[]>({
  queryKey: ['/api/germany/pages'],
  refetchInterval: 30000,
});

const allPages: CountryPage[] = [
  ...belgiumPages.map(page => ({ ...page, country: "Belgium", countryCode: "belgium" })),
  ...uaePages.map(page => ({ ...page, country: "UAE", countryCode: "uae" })),
  ...germanyPages.map(page => ({ ...page, country: "Germany", countryCode: "germany" })),
];

// Add to filter dropdown:
<SelectItem value="germany">🇩🇪 Germany</SelectItem>
```

## Benefits

✅ **Unified View** - See all e-invoicing updates in one place  
✅ **Real-time Updates** - Auto-refreshes every 30 seconds  
✅ **Country Filtering** - Filter by specific countries  
✅ **Date Filtering** - Filter by time range  
✅ **Search** - Search across all countries  
✅ **Chronological Order** - Latest updates appear first  
✅ **Scalable** - Easy to add more countries  

## Build Status

✅ Build completed successfully  
✅ No linter errors  
✅ TypeScript compilation passed  
✅ Bundle size: 362.90 kB  

## Testing

1. **View All Countries**:
   - Navigate to homepage
   - Should see updates from both Belgium and UAE
   - Each update should have a country badge

2. **Filter by Belgium**:
   - Select "🇧🇪 Belgium" from country filter
   - Should only see Belgium updates

3. **Filter by UAE**:
   - Select "🇦🇪 UAE" from country filter
   - Should only see UAE updates

4. **Search Across Countries**:
   - Type "invoice" in search bar
   - Should see matching results from all countries

5. **Date Filtering**:
   - Select "Last 7 Days"
   - Should only see recent updates from all countries

## Summary

The homepage now displays e-invoicing updates from **all active countries** (Belgium and UAE), providing a unified global view of e-invoicing developments. Users can filter by country, date, or search across all updates to find relevant information quickly.

