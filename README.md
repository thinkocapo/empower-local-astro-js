# Empower Plant — Astro edition 🌱

An Astro frontend for [empower-local](../empower-local)'s Flask backend, built to show **when Astro renders HTML**
and what each kind of rendering looks like in Sentry (`@sentry/astro`).

Astro runs its own Node server for SSR. That server, never the browser, calls Flask
([src/lib/api.ts](src/lib/api.ts)), so a single trace runs through three tiers:

```
browser pageload / click ──▶ Astro server (http.server) ──▶ Flask (http.server) ──▶ mocked SQL spans
   @sentry/astro (client)        @sentry/astro (server)          sentry-sdk (Python)
```

Flask's database is still mocked (that's empower-local's job), so there's no infrastructure to run.

## When does "SSR" happen?

Astro renders HTML at one of these times. This app uses all of them:

| When | How you opt in | Example here | Server span in Sentry? |
|---|---|---|---|
| **Build time** (`npm run build`) | `export const prerender = true` | `/`, `/about`, `/cart` shell | **No.** It's a static `.html` file by the time anyone visits. Only the browser SDK sees it. |
| **Request time** (true SSR) | default with `output: 'server'` | `/products`, `/products/[id]`, `/broken` | **Yes:** `http.server GET /products/[id]` → `http.client` → Flask `products`, linked to the browser `pageload` |
| **Request time, part of a page** (server island) | `<Comp server:defer />` | "Top rated" box on `/` (calls Flask) | **Yes:** `http.server GET /_server-islands/[name]` (its own trace, see note) |
| **User interaction → server** | API route / fetch | Checkout → `POST /api/checkout` | **Yes:** browser → Astro → Flask `checkout`, one trace via `sentry-trace`/`baggage` headers |
| **Browser only** (hydration / client render) | `client:load`, `client:visible`, `client:only` | cart badge, Add to cart, the cart itself | No. Browser spans, errors, and replay only |

The colored banner under the nav on every page shows which one you're looking at. Blue means built at build time
(the timestamp never changes on reload). Orange means rendered on request (the timestamp changes every reload).

### Pages vs. smaller components

Rendering is decided **per page** (`prerender`). Components can then change that for their own part of the page:

- **Plain `.astro` components** (e.g. `ProductCard`) render whenever their parent page renders and ship no JS.
- **Server islands** (`server:defer`) let a static page contain one small dynamic piece (stock levels, a "Hi, <name>"
  header, a personalized price). That's the realistic way to keep a page cached while one fragment stays live.
- **Client islands** (`client:*`) are React components that hydrate in the browser. `client:load` and `client:visible`
  are still rendered to HTML first (at build or request time). `client:only` skips the server entirely.

A typical real setup is marketing/docs/about pages prerendered, catalog/product/account pages SSR, cart and checkout
UI client-side, and API routes for mutations.

## Run

First start empower-local's Flask backend on :8080 (its React app isn't needed):

```bash
cd ../empower-local && docker compose up -d --build flask
```

Then this app:

```bash
npm install
cp .env.template .env   # add your Astro project's DSN to PUBLIC_SENTRY_DSN and SENTRY_DSN
npm run build && npm start
```

`BACKEND_URL` in `.env` points the Astro server at Flask (default `http://localhost:8080`). For traces to join
across the two projects, Flask's `FLASK_DSN` must be in the same Sentry org.

Open http://localhost:4321. `npm run dev` also works, but in dev mode *every* page renders on request, so use
build + start to see the real build-time vs. request-time split.

Things to try:

- Reload `/products` and open the trace: Astro `GET /products` → `GET http://localhost:8080/products` → Flask's
  N+1 of `SELECT * FROM reviews` spans.
- Add 9+ Plant Strollers (Flask stocks 8) and check out. Flask answers "failed" and the Astro endpoint raises
  `Not enough inventory for all items`, all in the trace that started with the browser click.
- Visit `/broken` to see an error thrown during SSR render.
- Visit `/about`. No server span at all, only a browser `pageload`.

## Sentry setup

- [astro.config.mjs](astro.config.mjs): `output: 'server'` + Node adapter + the `sentry()` integration. The integration
  automatically adds request middleware (the `http.server` spans) whenever an adapter is present.
- [sentry.client.config.ts](sentry.client.config.ts): browser SDK (tracing, replay, feedback). `PUBLIC_*` env vars
  are inlined at **build** time.
- [sentry.server.config.ts](sentry.server.config.ts): Node SDK. Reads `process.env` at **runtime**.
- Source maps upload during `npm run build` when `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` are set in `.env`
  (read in `astro.config.mjs` via `loadEnv`). Maps are deleted from `dist/` after upload.

### Known gaps

- **Server islands start a new trace.** Astro preloads the island with `<link rel="preload">` before the
  Sentry browser SDK loads, so no `sentry-trace` header goes with it. The island's server span is still
  captured, just not attached to the page's `pageload` trace.
- The server SDK is initialized when the first SSR route loads (`page-ssr` injection), not before the process boots.
  For full Node auto-instrumentation of third-party libraries (pg, redis, etc.), preload it with `node --import`.
  See the [Astro manual-setup docs](https://docs.sentry.io/platforms/javascript/guides/astro/manual-setup/).
