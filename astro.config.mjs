// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sentry from '@sentry/astro';

// output: 'server' => every page renders ON REQUEST by default.
// Pages that opt out with `export const prerender = true` are rendered ONCE at
// BUILD time into plain .html files (no server work, no server-side Sentry span).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
  integrations: [
    react(),
    sentry({
      // SDK options live in sentry.client.config.ts / sentry.server.config.ts.
      // These are build-time options for source-map upload (skipped if no token).
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    }),
  ],
});
