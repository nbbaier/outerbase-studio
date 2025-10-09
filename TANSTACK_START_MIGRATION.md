# TanStack Start Migration Analysis

## Overview

This document outlines the requirements for a 1:1 UI/UX migration from Next.js App Router to TanStack Start for Outerbase Studio. The goal is to ensure users experience no visible changes in functionality, behavior, or user experience.

## 1. Application Architecture

### Route Group Structure

The application uses Next.js route groups to organize different sections with distinct layouts and behaviors:

- **(outerbase)** - Authenticated workspace/cloud features with session management
- **(theme)** - Client database connections with theme provider
- **(public)** - Marketing and documentation pages with forced dark theme
- **(dark-only)** - Authentication flows (signin, signup, password reset, verify) with forced dark theme
- **playground** - Sandbox environments for SQLite and MySQL
- **storybook** - Component demonstration pages
- **embed** - Embeddable database client views
- **api** - API routes for analytics and proxying

### Dynamic Routing Patterns

Complex nested dynamic routes that must be preserved:

```
/w/[workspaceId]
/w/[workspaceId]/[baseId]
/w/[workspaceId]/board/[boardId]
/w/[workspaceId]/new-base/[driver]
/w/[workspaceId]/edit-base/[baseId]
/local/board/[boardId]
/local/edit-base/[baseId]
/local/new-base/[driver]
/client/s/[[...driver]]  (catch-all route)
/embed/[driver]
/embed/board/[boardId]
/playground/mysql/[roomName]
```

## 2. Data Flow & State Management

### Client-Side Storage

**IndexedDB (Dexie)** stores persistent data:
- `connection` table - Local database connections
- `board` table - Dashboard/board configurations
- `namespace` table - Database namespaces
- `saved_doc` table - Saved SQL queries and documents
- `file_handler` table - FileSystemFileHandle references for local SQLite files

### Data Fetching with SWR

Extensive use of SWR for client-side data fetching and caching:

```typescript
// Examples from the codebase:
useLocalConnectionList() - "/connections/local"
useLocalDashboardList() - "/dashboards/local"
useLocalConnection(id) - "/connections/local/${id}"
```

SWR configuration includes:
- Custom revalidation strategies
- Optimistic updates
- Manual mutation triggers
- Focus/reconnect revalidation control

### React Context Providers

Multiple context providers create the application state layer:

1. **OuterbaseSessionProvider** - User authentication session
2. **WorkspaceProvider** - Current workspace context
3. **DriverProvider** - Database driver instance
4. **SchemaProvider** - Database schema metadata
5. **AutoCompleteProvider** - SQL autocomplete data
6. **DialogProvider** - Global dialog management
7. **ThemeProvider** (next-themes) - Light/dark theme state

### Local Storage Usage

Used for:
- Authentication redirect flows (`continue-redirect` key)
- Legacy connection migration (one-time migration to IndexedDB)

## 3. Navigation & Routing Behavior

### Programmatic Navigation

Heavy use of `useRouter()` from `next/navigation` for imperative routing:

**Authentication flows:**
- Post-login redirect to stored destination
- Workspace switching after signup
- Sign out redirect to signin page

**Resource management:**
- Navigate to newly created bases/boards
- Redirect to edit pages
- Navigate to first valid workspace

**Example pattern:**
```typescript
const router = useRouter();
const redirect = localStorage.getItem("continue-redirect");
router.push(redirect ?? "/");
```

### URL Search Parameters

`useSearchParams()` extensively used for:

- **Connection parameters** - `?p={connectionId}`, `?s={sessionId}`
- **Template selection** - `?template=chinook`, `?template=northwind`
- **Theme controls** - `?disableThemeToggle=1`
- **Driver selection** - Various driver configurations passed via URL

### Pathname-Based Logic

`usePathname()` used for:
- Active navigation state highlighting
- Conditional UI rendering based on current route
- Analytics tracking (PageTracker component)
- Authentication guard logic

### URL Parameters

`useParams()` for accessing dynamic route segments:
- `workspaceId`, `baseId`, `boardId`, `driver`, `roomName`

## 4. Layout Hierarchy & Component Structure

### Nested Layout Architecture

**Root Layout** (`app/layout.tsx`):
- HTML wrapper with `suppressHydrationWarning`
- Global CSS imports (globals.css, codemirror-override.css)
- Metadata exports for SEO
- DialogProvider for global modals

**Theme Layout** (`app/(theme)/theme_layout.tsx`):
- next-themes ThemeProvider with optional forced themes
- Radix TooltipProvider
- Sonner toast notifications
- PageTracker for analytics
- External script loading (GitHub buttons)

**Route Group Layouts:**

1. **(outerbase)/layout.tsx**
   - ThemeLayout wrapper
   - ClientOnly boundary
   - OuterbaseSessionProvider
   - WorkspaceProvider

2. **(dark-only)/layout.tsx**
   - Same as (outerbase) but with `overrideTheme="dark"`

3. **(public)/layout.tsx**
   - ThemeLayout with `overrideTheme="dark"`

4. **(theme)/client/layout.tsx**
   - ThemeLayout only

### Client/Server Boundaries

**"use client" directives** on:
- All pages in (outerbase), (dark-only) route groups
- Theme layout component
- Most interactive pages
- Provider components
- Navigation components

**Server components:**
- Root layout
- Some wrapper pages that render client page bodies
- MDX documentation pages

## 5. Styling & Theming

### Tailwind CSS v4

Uses Tailwind v4 with the new configuration approach:

- **@theme directive** in globals.css for design tokens
- **Custom variants** for dark mode, interactive states
- **CSS variables** for theming (--color-*, --radius-*, etc.)
- **No tailwind.config.ts** - configuration in CSS

### Theme System (next-themes)

Critical theme behavior:

- **User-selectable theme** in most routes (light/dark toggle)
- **Forced dark theme** in (public) and (dark-only) route groups
- **Theme persistence** across sessions
- **Query parameter override** - `?disableThemeToggle=1`
- **Color scheme attribute** - `class` based theming
- **System theme support** via `enableColorScheme`

### Global Styles

Multiple CSS imports:
- `globals.css` - Tailwind and theme variables
- `codemirror-override.css` - Editor customizations
- `board-style.css` - Dashboard-specific styles
- `styles/markdown.css` - MDX content styling

## 6. API Routes & Server Functions

### API Routes

**POST /api/events**
- Analytics tracking endpoint
- Reads `x-od-id` header for device identification
- Validates request body with Zod
- Uses "use server" function for database insertion
- CORS headers for cross-origin requests

**Proxy Routes:**
- `/proxy/d1` - Cloudflare D1 proxy
- `/proxy/wae` - WebAssembly execution proxy

**Redirect Route:**
- `GET /connect` - Redirects to `/local` for backward compatibility

### Server-Side Headers

Uses `headers()` from `next/headers`:
- Device ID extraction
- Request header inspection

### API Rewrites

Next.js config includes rewrites:
```javascript
{
  source: "/api/v1/:path*",
  destination: "${NEXT_PUBLIC_OB_API}/:path*"
}
```

## 7. Metadata & SEO

### Static Metadata

Root layout exports:
```typescript
export const metadata: Metadata = {
  title: WEBSITE_NAME,
  keywords: ["libsql", "rqlite", "sqlite", ...],
  description: "...",
  openGraph: { siteName, description }
}
```

### Page-Level Metadata

Individual pages export metadata:
- Playground pages have custom titles
- Database-specific pages (MySQL, Postgres)
- MDX documentation pages export metadata objects

### Sitemap Generation

`app/sitemap.ts` exports MetadataRoute.Sitemap:
- Main pages
- Playground routes
- Documentation pages
- Static change frequency and priority values

### Favicon & Icons

- `app/favicon.ico`
- `app/icon.png`
- `app/apple-icon.png`

## 8. MDX Support

### MDX Configuration

Uses `@next/mdx` plugin:
- Configured in `next.config.js`
- `.mdx` extension in `pageExtensions`

### Documentation Structure

Documentation in `app/(public)/docs/`:
- `page.mdx` - Documentation index
- `connect-turso/page.mdx`
- `connect-valtown/page.mdx`
- `embed-iframe-client/page.mdx`

Each MDX file exports metadata and can include "use client" code blocks.

### MDX Components

Custom components defined in `mdx-components.tsx` for enhanced rendering.

## 9. Environment Variables & Build Configuration

### Environment Variables

Using `@t3-oss/env-nextjs` for type-safe environment variables:

**Server-side:**
- `BASE_URL`
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`
- `DATABASE_ANALYTIC_URL`
- `DATABASE_ANALYTIC_AUTH_TOKEN`
- `ENCRYPTION_KEY`

**Public (injected at build):**
- `NEXT_PUBLIC_STUDIO_VERSION` - From package.json version
- `NEXT_PUBLIC_OB_API` - API endpoint for rewrites

### Next.js Configuration

Key settings in `next.config.js`:
- `output: "standalone"` - For containerized deployment
- `reactStrictMode: false`
- `pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"]`
- MDX plugin integration
- API rewrites configuration

### Build Output

Configured for Cloudflare Workers deployment:
- Uses `@opennextjs/cloudflare` adapter
- OpenNext config for incremental cache (KV)
- Wrangler configuration for Workers deployment
- Custom build scripts: `preview`, `deploy`

## 10. Browser APIs & Critical Features

### File System Access API

Critical for SQLite file handling:
- `FileSystemFileHandle` for local database files
- Stored in IndexedDB for persistence
- File picker integration
- File save/export functionality

### Web Workers

SQL.js library loaded via external script:
```typescript
window.initSqlJs({
  locateFile: (file) => `/sqljs/${file}`
})
```

### Client-Only Rendering

`ClientOnly` component wrapper for browser-dependent features:
- Prevents SSR/hydration mismatches
- Used extensively in authenticated routes
- Wraps session providers

### Dynamic Imports

Next.js Script component for external resources:
- GitHub buttons script
- SQL.js WebAssembly module

## 11. UI Components & Libraries

### Radix UI Primitives

Extensive use of Radix UI headless components:
- Dialog, AlertDialog
- DropdownMenu, ContextMenu
- Tooltip, Popover, HoverCard
- Select, RadioGroup, Checkbox
- Toggle, ToggleGroup
- Separator, ScrollArea
- Collapsible, NavigationMenu
- Avatar, Label, Slot

### Other UI Libraries

- **Sonner** - Toast notifications
- **cmdk** - Command palette
- **Lucide React** - Icon library
- **Phosphor Icons** - Additional icons
- **CodeMirror** - SQL/JSON editor
- **XYFlow** - Flow diagrams
- **ECharts** - Data visualization
- **react-grid-layout** - Dashboard layouts
- **react-resizable-panels** - Resizable UI panels
- **Motion (Framer Motion)** - Animations
- **react-color** - Color picker

### Styling Utilities

- **class-variance-authority** - Component variants
- **clsx** / **tailwind-merge** - Conditional classes

## 12. User Experience Requirements

For a transparent 1:1 migration, users must experience:

### Navigation & Routing
- ✓ All URLs remain unchanged
- ✓ Back/forward browser navigation works identically
- ✓ Deep linking to specific workspaces/bases/boards preserved
- ✓ URL parameters maintain state correctly
- ✓ Programmatic navigation feels instant (no full page reloads)

### Authentication & Session
- ✓ Login/logout flows identical
- ✓ Redirect after authentication to intended destination
- ✓ Session persistence across tabs
- ✓ 2FA flows unchanged

### Data Persistence
- ✓ IndexedDB data remains accessible
- ✓ Local connections persist across sessions
- ✓ Saved queries and boards not lost
- ✓ File system handles continue working

### Theme & Appearance
- ✓ Theme preference persists
- ✓ Forced dark theme on auth/public pages
- ✓ Smooth theme transitions
- ✓ No flash of unstyled content (FOUC)
- ✓ No flash of wrong theme

### Interactive Features
- ✓ SQL editor autocomplete works identically
- ✓ Database query execution feels same speed
- ✓ File upload/download flows unchanged
- ✓ Drag-and-drop functionality preserved
- ✓ Toast notifications appear consistently
- ✓ Modal dialogs behave the same
- ✓ Keyboard shortcuts function identically

### Performance
- ✓ Initial page load time comparable or better
- ✓ Navigation transitions feel equally fast
- ✓ No regression in time-to-interactive
- ✓ Database operations maintain performance

### Edge Cases
- ✓ Direct navigation to protected routes redirects properly
- ✓ Invalid workspace/base IDs handle gracefully
- ✓ Legacy URL paths redirect correctly (`/connect` → `/local`)
- ✓ Missing data shows appropriate empty states

## 13. Key Dependencies to Preserve

### Critical Runtime Dependencies

```json
{
  "next-themes": "^0.4.4",
  "swr": "^2.3.0",
  "dexie": "^4.0.8",
  "@radix-ui/*": "Various headless UI components",
  "sonner": "^1.4.41",
  "@uiw/react-codemirror": "^4.21.21",
  "@libsql/client": "^0.5.3",
  "sql.js": "Database via public/sqljs",
  "zod": "^3.22.4"
}
```

### Next.js-Specific Features Used

- Route groups with parentheses
- Nested layouts
- Metadata API (`Metadata`, `MetadataRoute`)
- `next/navigation` hooks (useRouter, useSearchParams, usePathname, useParams)
- `next/headers` (headers function)
- `next/image` (minimal usage)
- `next/script` (Script component)
- API routes with route handlers
- `redirect()` function
- MDX integration via @next/mdx

## 14. Deployment Considerations

### Current Deployment Target

- **Platform:** Cloudflare Workers
- **Adapter:** @opennextjs/cloudflare
- **Cache:** Workers KV for incremental cache
- **Assets:** Static assets via Workers Assets binding
- **Output:** Standalone build mode

### Deployment Requirements

Must maintain:
- Same Cloudflare Workers compatibility
- KV namespace for caching
- Static asset serving from public directory
- Environment variable injection
- CORS handling for API routes
- Header manipulation capabilities

### Build Process

Current scripts that must be replicated:
```bash
npm run build       # Next.js build
npm run preview     # Local Cloudflare preview
npm run deploy      # Cloudflare Workers deployment
```

## 15. Summary

A successful TanStack Start migration must replicate:

1. **Complex routing** - Route groups, nested dynamic routes, catch-all routes
2. **Layout nesting** - Multiple layout levels with different providers
3. **Client/server boundaries** - Clear separation matching current architecture
4. **State management** - SWR data fetching, multiple context providers, IndexedDB
5. **Navigation** - Programmatic routing, URL parameters, pathname-based logic
6. **Theming** - Dynamic themes with forced theme support per route group
7. **MDX support** - Documentation pages with metadata
8. **API routes** - Server endpoints for analytics and proxying
9. **Metadata & SEO** - Static and dynamic metadata, sitemap generation
10. **Browser APIs** - File System Access, Web Workers, IndexedDB
11. **Deployment** - Cloudflare Workers compatibility maintained

The migration challenge is not just moving code, but ensuring TanStack Start can handle:
- The same level of layout nesting and composition
- Equivalent client/server boundaries
- Similar metadata and SEO capabilities
- API route functionality
- Cloudflare Workers deployment model

Users should perceive **zero difference** in:
- Visual appearance
- Navigation behavior
- Data persistence
- Feature functionality
- Performance characteristics
- URL structure

