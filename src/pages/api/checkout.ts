// ON-DEMAND API endpoint, triggered by a user interaction (Checkout click).
// It forwards the order to Flask's POST /checkout. The browser's trace continues
// here (sentry-trace header) and on into Flask, so one trace covers all three.
import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';
import { checkout, type CheckoutItem } from '../../lib/api';

export const POST: APIRoute = async ({ request }) => {
  const { items } = (await request.json()) as { items: CheckoutItem[] };
  Sentry.setTag('cart.size', items.length);

  const result = await checkout(items);
  if (result.status !== 'success') {
    // Flask answers 200 with a status, so raise it here to record a server error.
    const titles = result.status === 'partial' ? result.out_of_stock.join(', ') : 'all items';
    throw new Error(`Not enough inventory for ${titles}`);
  }

  Sentry.logger.info('Order placed', { items: items.length });
  return Response.json({ orderId: crypto.randomUUID().slice(0, 8) });
};
