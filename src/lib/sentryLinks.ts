/**
 * Deep links into the viewer's own Sentry org, built from .env — nothing is
 * hardcoded, so anyone who runs this gets links to *their* project.
 *
 *   SENTRY_ORG          -> org slug        -> https://<org>.sentry.io
 *   PUBLIC_SENTRY_DSN   -> project id      -> the number at the end of the DSN
 *
 * Used by prerendered pages, so this runs at BUILD time and the links are baked
 * into the HTML. Change .env, rebuild, and the links follow.
 */
const org = import.meta.env.SENTRY_ORG?.trim() || undefined;
const dsn = import.meta.env.PUBLIC_SENTRY_DSN?.trim() || '';
const projectId = dsn.match(/\/(\d+)\/?$/)?.[1];

const base = org ? `https://${org}.sentry.io` : 'https://sentry.io';

function link(path: string, params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams({ ...(projectId && { project: projectId }) });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const query = qs.toString();
  return `${base}${path}${query ? `?${query}` : ''}`;
}

export const sentryLinks = {
  configured: Boolean(org && projectId),
  org,
  traces: link('/explore/traces/', { query: 'span.op:http.server', statsPeriod: '1h' }),
  issues: link('/issues/', { query: 'is:unresolved', statsPeriod: '24h' }),
  // Prebuilt dashboards get a per-org id, so link to the list filtered by name.
  nextjsDashboard: link('/dashboards/', { query: 'Next.js Overview' }),
  // Completed client-side with the current page's trace id.
  traceBase: `${base}/explore/traces/trace/`,
};
