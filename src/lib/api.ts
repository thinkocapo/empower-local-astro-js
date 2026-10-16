/**
 * Client for empower-local's Flask backend (http://localhost:8080 by default).
 *
 * Only on-demand code (SSR pages, server islands, API routes) calls this, so
 * every call happens inside the Astro server's `http.server` span. The Sentry
 * Node SDK instruments fetch: each call gets an `http.client` span and
 * `sentry-trace`/`baggage` headers, so Flask's transaction joins the same trace.
 *
 *   browser pageload -> Astro http.server -> http.client -> Flask -> mocked SQL spans
 */
import type { Product, Review } from './data';

// Read at runtime on the server, so one build can point at any backend.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export type ProductWithReviews = Product & { reviews: (Review & { productid: number })[] };
export type CheckoutItem = { id: number; title: string; price: number; qty: number };
export type CheckoutResult = { status: 'success' } | { status: 'failed' } | { status: 'partial'; out_of_stock: string[] };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, init);
  if (!res.ok) throw new Error(`Flask ${init?.method ?? 'GET'} ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export function getProducts() {
  return request<ProductWithReviews[]>('/products');
}

/** Flask has no single-product endpoint, so fetch the list and pick one (like the React app does). */
export async function getProduct(id: number) {
  return (await getProducts()).find((p) => p.id === id);
}

/** Flask expects the React app's cart shape: items, quantities keyed by id, and total. */
export function checkout(items: CheckoutItem[]) {
  const cart = {
    items: items.map(({ id, title, price }) => ({ id, title, price })),
    quantities: Object.fromEntries(items.map((i) => [i.id, i.qty])),
    total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
  };
  return request<CheckoutResult>('/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart }),
  });
}
