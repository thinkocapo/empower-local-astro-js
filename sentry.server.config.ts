// Runs in the NODE server process. Only on-demand (SSR) routes, server islands
// and API endpoints execute here at request time. Prerendered pages are already
// HTML on disk and never touch this code at runtime.
import * as Sentry from '@sentry/astro';

Sentry.init({
  // process.env => read at RUNTIME, so the same build can point at any project.
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE ?? 'empower-astro@1.0.0',
  environment: process.env.SENTRY_ENVIRONMENT ?? 'local',
  tracesSampleRate: 1.0,
  enableLogs: true,
  debug: process.env.SENTRY_DEBUG === 'true',
});
