# TanStack Start Implementation Plan

> **Goal:** Migrate Outerbase Studio from Next.js App Router to TanStack Start with zero visible UX change for users.

## Executive Goals

- Preserve URLs, navigation behavior, UI layouts, theming, IndexedDB, and performance
- Migrate incrementally with parallel validation
- Keep client-heavy behavior and browser APIs (File System Access, Web Workers) unchanged

---

## PHASE 0 — Preparation and Baseline (1–2 days)

### Inventory and Freeze

- Export a route matrix of all current URLs, params, and search params (from TANSTACK_START_MIGRATION.md)
- Capture baseline performance metrics (Lighthouse, bundle size)
- Record E2E flows of critical user journeys

### Create Parity Test Suite

**Playwright E2E scripts covering:**

- Auth flows (signin, signup, logout, redirect logic)
- Workspace switching, creating/editing bases/boards
- Local connections and file handle persistence
- Deep links to all dynamic routes listed
- Theme behavior (forced dark in public/auth groups)
- URL/search param-dependent UI

**Data integrity tests:**

- Dexie presence and tables
- FileSystemFileHandle persistence across reloads

**Visual regression:**

- Update Storybook and use Chromatic (or Percy) to lock component visuals

### Decide Rollout Strategy

**Staged dual deployment using Cloudflare route steering:**

- Run both Next.js Worker and TanStack Start Worker in parallel
- Use cookie-based canary or header route to split traffic gradually (0% → small % → 100%)
- Ensures URLs remain identical while switching serving worker

---

## PHASE 1 — Scaffold TanStack Start App (2–3 days)

### Repo Setup

- Initialize TanStack Start (Vite-based) + React 18/19
- Integrate Tailwind v4 (CSS-first; keep the `@theme` directive)
- Preserve same CSS files: `globals.css`, `codemirror-override.css`, `board-style.css`, `styles/markdown.css`
- Configure TypeScript path aliases to ease migration

### Static Assets

- Ensure all public assets (including `/sqljs/*`) are served from the same paths

### MDX Baseline

- Add MDX support via Vite plugin (`@mdx-js/rollup`)
- Keep `mdx-components.tsx`

### Root SSR Entry

- Set up Start's server entry that can run on Cloudflare Workers
- Prepare an `index.html` or Head system for metadata injection

---

## PHASE 2 — Routing and Layouts Scaffolding (3–5 days)

**Goal:** Replicate the route tree and route-group behavior with nested layouts and dynamic params.

### File-Based Routing

Establish `src/routes` with dynamic segments using TanStack Router conventions:

**Dynamic segments:** Use `$param` pattern (e.g., `/w/$workspaceId`)  
**Catch-all:** Use `$...splat` (e.g., `/client/s/$...driver`)

**Create route directories mirroring Next paths:**

```
/w/$workspaceId
/w/$workspaceId/$baseId
/w/$workspaceId/board/$boardId
/w/$workspaceId/new-base/$driver
/w/$workspaceId/edit-base/$baseId
/local/board/$boardId
/local/edit-base/$baseId
/local/new-base/$driver
/client/s (with $...driver catch-all)
/embed/$driver
/embed/board/$boardId
/playground/mysql/$roomName
/storybook
```

### Layout Hierarchy

Recreate layout nesting by route structure:

**Root layout:**

- HTML wrapper, CSS imports, DialogProvider
- Global toasts, TooltipProvider, PageTracker
- GitHub buttons script injection

**Theme layouts:**

- Wrap group sections with ThemeProvider and optional forced theme

**Group-specific layouts (mapping Next route groups):**

1. **(outerbase):** ThemeLayout + ClientOnly + OuterbaseSessionProvider + WorkspaceProvider
2. **(dark-only):** Same as (outerbase), but forced dark theme
3. **(public):** ThemeLayout forced dark
4. **(theme)/client:** ThemeLayout only

Implement by introducing layout components at folder boundaries in the route tree. Use route context to pass group metadata (e.g., `forcedTheme`).

### Route Contexts and Params

- Use route context to expose `workspaceId`/`baseId`/`boardId` and group flags to children
- Validate search params with Zod at the route level (`parseSearch`) to preserve behavior for `p`, `s`, `template`, `disableThemeToggle`, `driver`

---

## PHASE 3 — Navigation API Compatibility Layer (2–3 days)

**Goal:** Minimize code churn by providing drop-in replacements for `next/navigation`.

### Introduce Compatibility Layer

Create `src/compat/navigation.ts` with path aliases:

```typescript
// Map imports: next/navigation → src/compat/navigation.ts

// Implement wrappers using TanStack Router:
- router.push → navigate({ to, replace? })
- useSearchParams → useSearch() + setter functions
- usePathname → useLocation().pathname
- useParams → useParams()
- redirect() → throw redirect({ to }) in loader/action
```

### Preserve Existing Behavior

- Implement `continue-redirect` logic via localStorage unchanged
- On signin success, read localStorage and navigate
- Provide imperative APIs identical to current code signatures

### PageTracker and Analytics

- Subscribe to router state changes or `onLoad` to send page views
- Mirror current analytics behavior

---

## PHASE 4 — Theming and Providers (2–3 days)

### Theming (next-themes)

- Keep `next-themes` library
- Provide ThemeProvider at appropriate layout levels
- Implement forced dark theme via route context (public and dark-only groups)
- Preserve query override `?disableThemeToggle=1` by reading search params at layout level

**Avoid FOUC:**

- Apply system theme detection early
- SSR inject class and data-theme
- Consider no-FOUC script in `index.html`

### Providers

Port existing providers as-is:

- OuterbaseSessionProvider
- WorkspaceProvider
- DriverProvider
- SchemaProvider
- AutoCompleteProvider
- DialogProvider

Wrap under route layouts to replicate scoping by route group. Any server-derived context moves to route loader or server functions.

---

## PHASE 5 — Data Layer and Browser APIs (Parallel with Phases 3–4)

### SWR

- Add SWRConfig at root with identical config
- Keep hooks (`useLocalConnectionList`, etc.) unchanged
- Ensure fetcher base URLs are the same

### Dexie

- No change needed
- Ensure SSR does not access IndexedDB
- Guard with ClientOnly or lazy effects

### File System Access

- No change needed
- Confirm same code paths and permissions
- Keep FileSystemFileHandle storage in IndexedDB

### Web Workers / SQL.js

- Inject SQL.js WASM initialization script:
   ```typescript
   window.initSqlJs({ locateFile: (f) => `/sqljs/${f}` });
   ```
- Ensure `/sqljs` assets are in public and served identically
- Replace Next's `next/script` with `<script async>` in `index.html` or `useEffect` + dynamic import

---

## PHASE 6 — Server Features and APIs on Cloudflare (3–5 days)

**Goal:** Replicate `/api` endpoints, header access, and rewrites in Cloudflare Worker-compatible code.

### API Routes Approach

**Recommended:** Add a tiny router (Hono or bare switch) inside Worker fetch handler before delegating to TanStack Start's SSR handler:

**Endpoints to implement:**

- **POST /api/events:** Zod-validated; read `x-od-id`; CORS; write to DB
- **Proxy routes:** `/proxy/d1` and `/proxy/wae` with fetch to configured targets
- **Redirect:** `/connect` → 302/307 redirect to `/local`

### next/headers Equivalency

Move `headers()` logic to:

- Route loaders (server-side) with access to request headers via context
- Or read headers in Worker API endpoints and forward to client

### API Rewrites

- Implement `/api/v1/:path*` rewrite to `NEXT_PUBLIC_OB_API` in Worker fetch handler before SSR
- Maintain CORS policy and auth headers

### Environment Variables

Replace `@t3-oss/env-nextjs` with universal env reader:

**Server:** Use Wrangler secrets and env bindings (`cf.env`)  
**Client:** Inject build-time public vars via Vite define (`import.meta.env.VITE_*`)

Map `NEXT_PUBLIC_*` to `VITE_*`  
Ensure `NEXT_PUBLIC_STUDIO_VERSION` is injected from `package.json`

### Server-Only Code

Refactor any Next server components to:

- Route loaders (for SSR fetching) and pass data as props
- Server functions callable from client (TanStack Start's `createServerFn`)
- Worker API endpoints consumed by SWR hooks

Prefer loaders for SSR-only content that must render on first paint.

---

## PHASE 7 — MDX and Metadata/SEO (2–3 days)

### MDX

- Configure Vite MDX with same remark/rehype plugins
- Keep `mdx-components.tsx` and ensure it's provided via MDXProvider

### Metadata and Sitemaps

Replace Next's Metadata API with head manager:

- Use TanStack Start's head utilities or `react-helmet-async`
- Implement per-route Head components that set title/description/og tags
- Recreate sitemap and robots generation via Worker endpoint or build script

### next/image Replacement

- Replace minimal usage with `<img>` or lightweight component (e.g., `@unpic/react`)
- Keep URLs and sizes identical

---

## PHASE 8 — Complete Route Tree and Parity QA (5–7 days)

### Port All Pages

Ensure:

- All routes exist with same path strings and params
- All layouts and providers wrap matching subtrees
- All imperative navigation points call compat router wrappers
- URL search params are parsed and update UI state as before

### Performance Parity

- Verify SSR + hydration times are comparable or better
- Confirm code splitting via Vite dynamic imports

### Accessibility and UX Parity

- Validate keyboard shortcuts, dialogs, toasts, drag/drop behaviors

---

## PHASE 9 — Testing and Incremental Rollout (Continuous)

### Run Full Test Suite

- E2E parity suite against TanStack Start in preview environment
- Visual regression tests across key pages and components

### Data Integrity

- Confirm IndexedDB data sets are intact pre/post migration
- Verify FileSystemFileHandle persistence across refreshes

### Theming and FOUC

- Test initial render in all groups with/without system dark mode
- Verify no flash of wrong theme or unstyled content

### Canary Deploy

- Route 1–5% of traffic to TanStack Start Worker via Cloudflare Rules
- Monitor logs, errors, and performance
- Expand gradually to 100%

---

## PHASE 10 — Cutover, Cleanup, and Decommission (1–2 days)

- Flip 100% traffic to TanStack Start Worker
- Remove Next.js-specific dependencies and compat aliases
- Archive unused code
- Update documentation
- Finalize build/deploy scripts

---

## Handling Complex Routing Structure

### Route Groups → Layouts

- Map `(outerbase)`, `(dark-only)`, `(public)`, `(theme)/client` to directory-level layout components
- Use route context to signal `forcedTheme` and guard behavior

### Nested Layouts

- Implement nested folders with layout files
- Providers stack identically to Next's nested layouts

### Dynamic Routes

- Use `$param` for single segments (e.g., `/w/$workspaceId`)
- Use `$...splat` for catch-all (e.g., `/client/s/$...driver`)
- Provide sibling static route for `/client/s`

### Guarding and Redirects

- Auth guards move to route loaders (server) or `onLoad` hooks
- Use `throw redirect` in loaders for protected routes

### Pathname-Based Logic

- Replace `usePathname` with router location or route matches
- Continue using for active nav and analytics

---

## Next.js → TanStack Start Feature Mapping

| Next.js               | TanStack Start                                               |
| --------------------- | ------------------------------------------------------------ |
| `useRouter().push`    | `useNavigate()`                                              |
| `useSearchParams`     | `useSearch()`                                                |
| `usePathname`         | `useLocation().pathname`                                     |
| `useParams`           | `useParams()`                                                |
| `redirect()` (server) | `throw redirect({ to })` in loader                           |
| `next/headers`        | Request headers in loader context or Worker fetch            |
| `next/script`         | `<script async/defer>` or dynamic import in effects          |
| `next/image`          | `<img>` or minimal image component                           |
| Metadata API          | Per-route Head using `react-helmet-async` or Start utilities |
| API routes            | Worker fetch routes (Hono or manual switch)                  |
| MDX                   | Vite MDX plugin + MDXProvider                                |

---

## Maintaining UX During Migration

- **Compatibility wrappers** for navigation APIs to keep call sites unchanged initially
- **Preserve search param semantics** using Zod parsing
- **Preserve global providers** and exact placement in layout tree
- **Avoid SSR of browser-only components** using ClientOnly boundary
- **Theme initialization inline** in `index.html` to eliminate FOUC
- **Serve static assets** on identical URLs
- **Keep SWR and Dexie unchanged** to preserve caching behaviors

---

## Testing and Validation Strategies

### Route Parity Tests

- Generate server-side list of known routes from TanStack Router route tree
- Diff against inventory

### E2E Flows (Playwright)

- Auth (incl. 2FA)
- Workspace switching
- CRUD for bases/boards
- Embed views
- Playground
- Client routes with optional driver

### Persistence

- Dexie tables survival across reloads
- FileSystemFileHandle survival across deploys

### Theming

- Validate forced dark routes
- Theme toggle presence/absence with `?disableThemeToggle=1`

### Performance

- Budget thresholds for TTI/LCP
- Compare to baseline
- Ensure dynamic imports for heavy modules still split properly

### API Contract Tests

- `/api/events` schema validation (Zod), CORS, header `x-od-id`
- Proxy endpoints behave identically

### Visual Regression

- Storybook snapshots for core components

---

## Deployment Considerations for Cloudflare Workers

### Build

Vite build outputs:

- Client assets
- Worker SSR bundle

Use TanStack Start's Cloudflare adapter or create custom Worker fetch handler:

- Handle `/api/*` and `/proxy/*` first
- Fall through to SSR handler for all other requests
- Serve static assets from built client directory (Workers Assets binding)

### wrangler.toml

```toml
main = "path to SSR worker bundle"
[assets]
  directory = "client build output/public"
  binding = "ASSETS"

[[kv_namespaces]]
  binding = "CACHE"
  id = "..."
```

### Environment Bindings

- Map `NEXT_PUBLIC_*` → `VITE_*` at build time for client
- Use Wrangler secrets for server env

### Preview Scripts

```bash
bun run build    # Vite build + SSR bundle
bun run preview  # wrangler dev serving API + SSR
bun run deploy   # wrangler publish
```

### Edge Headers and CORS

- Replicate CORS headers for API endpoints exactly
- Ensure Response headers (analytics, redirects) are identical

---

## Risk Mitigation and Incremental Validation

- Run Start alongside Next in parallel, steering 1–5% traffic using Cloudflare routes based on cookie/flag header
- Introduce kill switch cookie that forces routing back to Next on error patterns
- Maintain single source of truth for shared business logic (SWR hooks, Dexie, providers)
- Keep compat layer until cutover is complete

---

## Concrete Deliverables Checklist

- [ ] Scaffolded TanStack Start app with Tailwind v4 and MDX
- [ ] Route tree reproducing all dynamic paths and catch-alls
- [ ] Layouts and providers matching route groups with forced-theme support
- [ ] Navigation compat wrappers replacing `next/navigation` at call sites
- [ ] API endpoints ported to Worker fetch (events, proxy, redirect)
- [ ] Head/SEO implemented per-route
- [ ] SWR and Dexie wired and working; ClientOnly boundary in place
- [ ] SQL.js assets and initialization preserved at `/sqljs`
- [ ] `wrangler.toml` with assets, KV, and env bindings
- [ ] Build/preview/deploy scripts
- [ ] Full E2E, visual, and performance parity passing
- [ ] Canary plan executed and ramped to 100%
- [ ] Decommission Next.js

---

## Summary

This plan minimizes risk by:

1. First reproducing the routing/layout skeleton and compatibility layers
2. Keeping state and UI libraries unchanged
3. Progressively porting server/APIs and metadata
4. Validating via parity tests and canary rollout on Cloudflare Workers

The phased approach allows for incremental validation at each step, ensuring users never experience disruption while the migration progresses.
