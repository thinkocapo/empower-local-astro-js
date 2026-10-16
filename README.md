# Empower Plant — Astro edition 🌱

A small Astro version of [empower-local](../empower-local): the same plant shop and mocked "database", built to show
**when Astro renders HTML** and what each kind of rendering looks like in Sentry (`@sentry/astro`).

No backend services. The DB is mocked in [src/lib/db.ts](src/lib/db.ts), and every fake query opens a span named after
the SQL it stands in for, so the trace waterfall looks real.

## When does "SSR" happen?

Astro renders HTML at one of these times. This app uses all of them:

| When | How you opt in | Example here | Server span in Sentry? |
|---|---|---|---|
| **Build time** (`npm run build`) | `export const prerender = true` | `/`, `/about`, `/cart` shell | **No.** It's a static `.html` file by the time anyone visits. Only the browser SDK sees it. |
| **Request time** (true SSR) | default with `output: 'server'` | `/products`, `/products/[id]`, `/broken` | **Yes:** `http.server GET /products/[id]` with DB child spans, linked to the browser `pageload` |
| **Request time, part of a page** (server island) | `<Comp server:defer />` | live inventory box on `/` | **Yes:** `http.server GET /_server-islands/[name]` (its own trace, see note) |
| **User interaction → server** | API route / fetch | Checkout → `POST /api/checkout` | **Yes**, and joined to the browser trace via `sentry-trace`/`baggage` headers |
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

```bash
npm install
cp .env.template .env   # add your Astro project's DSN to PUBLIC_SENTRY_DSN and SENTRY_DSN
npm run build && npm start
```

Open http://localhost:4321. `npm run dev` also works, but in dev mode *every* page renders on request, so use
build + start to see the real build-time vs. request-time split.

Things to try:

- Reload `/products` a few times and look at **Traces**: `GET /products` with an N+1 of `SELECT * FROM reviews` spans.
- Add 4+ of one product to the cart and check out. You'll get `Not enough inventory for product N` on the server,
  in the same trace as the browser click.
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
