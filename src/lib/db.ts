/**
 * MOCKED data layer — there is no database. Like empower-local's flask/src/db.py,
 * each function opens a Sentry span named after the SQL it *would* run, so the
 * server-side trace waterfall looks realistic.
 *
 * Only on-demand code paths (SSR pages, server islands, API routes) call these,
 * so these spans only ever show up under a request-time `http.server` span.
 */
import * as Sentry from '@sentry/astro';
import { PRODUCTS, REVIEWS, type Product, type Review } from './data';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number) => base + Math.random() * base;

// Process-wide mutable state stands in for an inventory table. Resets on restart.
const INVENTORY = new Map<number, number>(PRODUCTS.map((p) => [p.id, 3]));

function query<T>(sql: string, attrs: Record<string, string | number>, ms: number, fn: () => T): Promise<T> {
  return Sentry.startSpan(
    { op: 'db', name: sql, attributes: { 'db.system': 'postgresql', ...attrs } },
    async () => {
      await sleep(jitter(ms));
      return fn();
    },
  );
}

/** N+1 on purpose: one products query, then one reviews query per product. */
export async function getProducts(): Promise<(Product & { reviews: Review[] })[]> {
  return Sentry.startSpan({ op: 'function', name: 'db.getProducts' }, async () => {
    const products = await query('SELECT * FROM products', {}, 40, () => PRODUCTS);
    const withReviews = [];
    for (const p of products) {
      const reviews = await query('SELECT * FROM reviews WHERE productId = $1', { productId: p.id }, 15, () =>
        REVIEWS.filter((r) => r.productId === p.id),
      );
      withReviews.push({ ...p, reviews });
    }
    return withReviews;
  });
}

export async function getProduct(id: number) {
  return Sentry.startSpan({ op: 'function', name: 'db.getProduct' }, async () => {
    const product = await query('SELECT * FROM products WHERE id = $1', { productId: id }, 20, () =>
      PRODUCTS.find((p) => p.id === id),
    );
    if (!product) return undefined;
    const reviews = await query('SELECT * FROM reviews WHERE productId = $1', { productId: id }, 15, () =>
      REVIEWS.filter((r) => r.productId === id),
    );
    return { ...product, reviews };
  });
}

export async function getInventory(ids: number[]) {
  return query('SELECT * FROM inventory WHERE productId = ANY($1)', { productIds: ids.join(',') }, 25, () =>
    ids.map((id) => ({ productId: id, count: INVENTORY.get(id) ?? 0 })),
  );
}

export async function decrementInventory(productId: number, qty: number) {
  return query('UPDATE inventory SET count = count - $1 WHERE productId = $2', { productId, qty }, 20, () => {
    INVENTORY.set(productId, (INVENTORY.get(productId) ?? 0) - qty);
  });
}
