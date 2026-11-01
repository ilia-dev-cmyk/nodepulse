# NodePulse

NodePulse is a portfolio-grade frontend demonstration of an uptime monitoring and
service-health SaaS. It pairs a premium marketing site with a fully interactive
dashboard for monitoring services, investigating incidents, and exploring latency
analytics.

**Everything in NodePulse is fictional.** There is no backend, no database, and no
real monitoring. Every monitor, incident, region, and chart is generated from a
deterministic sample dataset shipped with the app.

## What is interactive

- **Marketing site** — responsive navigation with an accessible mobile panel, anchor
  navigation, a live dashboard preview rendered from the same components as the app,
  working FAQ accordions, and honest illustrative pricing (no checkout).
- **Dashboard shell** — sticky sidebar with active-state indicators, topbar with a
  demo-environment label, command palette (`Ctrl/⌘ + K`) that searches real local
  monitors and incidents, a notification dropdown with mark-as-read, and a profile menu.
- **Overview** — metrics computed from the dataset, an uptime chart and response-time
  chart that both change with the 24h / 7d / 30d range selector, active-incident panel,
  regional latency breakdown, and a monitor table with a detail drawer.
- **Monitors** — search across name/endpoint/region, status filters with live counts,
  sortable columns plus a sort preset selector, row actions, and an accessible add-monitor
  dialog with field-level validation.
- **Incidents** — status filters, search across titles and affected services, a detail
  drawer with timeline, and resolve/reopen flows guarded by a confirmation dialog. These
  update incident views and the overview counters.
- **Analytics** — response-time trend, uptime trend, current status distribution,
  monitor comparison (up to four monitors), and regional performance, all responding to
  the time-range control.
- **Settings** — workspace name, default interval, timestamp display, table density,
  notification preferences, and a complete dark/light theme. Theme and settings persist
  in `localStorage`; records can be reset to the seeded dataset.

Charts are hand-built SVG with pointer and keyboard interaction (`←`/`→`, `Home`, `End`)
and a screen-reader live region describing the focused data point.

## Tech stack

React 18 · TypeScript · Vite 5 · React Router 6 · Lucide React · plain CSS with custom
properties. No UI framework, charting library, or state-management dependency.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Production build and preview:

```bash
npm run build
npm run preview
```

Type checking runs as part of `npm run build` (`tsc --noEmit && vite build`).

## Routes

| Path | Description |
| --- | --- |
| `/` | Marketing site |
| `/app` | Dashboard overview |
| `/app/monitors` | Monitor management |
| `/app/incidents` | Incident management |
| `/app/analytics` | Analytics |
| `/app/settings` | Workspace settings |
| anything else | Branded 404 page |

Detail views are deep-linkable: `/app/monitors?monitor=core-api`,
`/app/incidents?incident=INC-2479`, `/app/settings?tab=data`.

## Deployment

The app is a static SPA. `npm run build` outputs to `dist/`. Because it uses client-side
routing, configure a single-page fallback to `index.html`:

- **Netlify** — `netlify.toml` pins the build (`npm run build`) and the publish directory
  (`dist`) plus Node 22, so a site connected to this GitHub repository needs no manual build
  settings. `public/_redirects` is included (`/* /index.html 200`) and is copied to `dist/`
  automatically. `public/_headers` adds baseline security headers (`nosniff`,
  `Referrer-Policy`, `X-Frame-Options`, a restrictive `Permissions-Policy`) and long-lived
  immutable caching for hashed assets. `public/robots.txt` and `public/sitemap.xml` exist as
  real files so the SPA catch-all cannot answer those paths with HTML.
  Note: no `Content-Security-Policy` is shipped, because a nonce/hash policy needs server-side
  templating that a plain static build does not provide.
- **Vercel** — `vercel.json` is included with a catch-all rewrite.
- **GitHub Pages / other hosts** — serve `index.html` for unknown paths, or add the
  equivalent rewrite rule.

Deploying from this repository on Netlify: push to `main`, and the site rebuilds from the
committed source. `node_modules/`, `dist/` and `.netlify/` are git-ignored, so only source
files are uploaded. Any change under `public/` (redirects, headers, robots, sitemap, icons)
must be committed to take effect — it is not baked into the app bundle.

## Verification

This repository does **not** ship an automated test suite, and there is no `test` or `lint`
script in `package.json`. Test tooling was deliberately kept out of the dependency list so
`npm install` stays small.

What is reproducible for anyone cloning the project:

```bash
npm ci
npm run build     # runs `tsc --noEmit` then the production Vite build
npm run preview   # serve the built SPA
```

Both `npm ci` and `npm run build` complete cleanly against the committed lockfile.

The following behaviours were additionally verified manually in Chromium 130 (desktop and
emulated mobile viewports) using throwaway browser scripts that are not part of this
repository — so the checks below describe what was observed, not a shipped test suite:

- All six routes plus the 404 page render without console errors or React warnings, in both
  the dev server (React StrictMode) and the production build.
- Every internal link collected across the app resolves to a page with a heading.
- Overview metric counts agree with the monitor and incident lists, the sidebar badge, and the
  filter counts; pausing a monitor and resolving an incident update those numbers everywhere.
- Monitor search, status filters, sorting, creation with invalid and valid input, pause/resume,
  and the detail drawer; incident filters, search, detail drawer, resolve, and reopen.
- Analytics range switching, monitor comparison (including the four-monitor cap), and
  keyboard chart navigation (`←`/`→`, `Home`, `End`, `Escape`) with the screen-reader live region.
- Chart pointer accuracy: the selected data point and the tooltip were measured against the
  pointer position at 320, 360, 390, 768, 1024, and 1440 px widths.
- Dialog lifecycle: opening, closing by button, Escape, and backdrop click; deep-linked
  drawers; a confirmation modal stacked above a drawer; and `document.body` scroll-lock
  restoration after each of those transitions.
- Settings save/reload persistence of workspace name, default interval, notification
  preferences, and theme (light and dark).
- No horizontal document overflow on any route at 320, 360, 390, 768, 1024, 1280, and 1440 px.
- Deployment hygiene on the published Netlify build: `/robots.txt` and `/sitemap.xml` return
  their real files (previously the SPA catch-all answered them with HTML), `/og.png` and
  `/apple-touch-icon.png` resolve, and the skip link moves focus into `<main>` on the marketing,
  dashboard, and 404 pages.

The same core flows (native `<dialog>` drawers and modals, scroll lock, chart pointer and
keyboard interaction, mobile navigation, settings persistence, theme) were also exercised in
**Firefox 131** against the deployed build, with no console errors.

Known gap: **WebKit/Safari was not tested.** The Playwright WebKit build could not start in the
sandbox used for this verification (it requires libicu 66, which the host does not provide), so
Safari behaviour — including native `<dialog>` support and its open/close events — relies on
standards support rather than an observed run.

## Demo data and limitations

- Monitors, incidents, notifications, and every derived metric are seeded sample data in
  `src/data/demoData.ts`. Nothing is fetched.
- No network requests are made to monitored endpoints. Adding a monitor creates a local
  record in a paused state; pausing or resuming changes local state only.
- Incident resolution and reopening update only local demo state. No alert, email, or page
  is sent.
- Records reset on reload by design so the demo always starts from a known state. Workspace
  settings and the theme persist in `localStorage`.
- There is no authentication, billing, or multi-workspace support; these are deliberately
  out of scope for a frontend portfolio demonstration.

## Structure

```
src/
  app/          App shell, layout, routes
  components/   charts, layout, marketing, monitors, navigation, incidents, ui
  data/         types + deterministic sample dataset
  hooks/        dialog sync, element width, document title, URL drawers
  lib/          formatting, selectors, chart series, sorting, validation
  pages/        Landing, Overview, Monitors, Incidents, Analytics, Settings, NotFound
  store/        demo data provider, toast provider
  styles/       tokens, global, components, layout, marketing, pages
```
