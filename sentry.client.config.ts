// Runs in the BROWSER on every page (prerendered and on-demand alike).
import * as Sentry from '@sentry/astro';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  release: import.meta.env.PUBLIC_SENTRY_RELEASE ?? 'empower-astro@1.0.0',
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? 'local',
  tracesSampleRate: 1.0,
  // Same-origin fetches (/api/*) get sentry-trace + baggage headers automatically,
  // so client interactions continue into the server trace.
  tracePropagationTargets: ['localhost', /^\//],
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    Sentry.feedbackIntegration({ colorScheme: 'system' }),
  ],
});
