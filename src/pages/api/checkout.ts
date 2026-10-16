// ON-DEMAND API endpoint, triggered by a user interaction (Checkout click).
// Errors thrown here are captured by the Sentry middleware and linked to the
// browser trace that made the fetch.
import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';
import { decrementInventory, getInventory } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const { items } = (await request.json()) as { items: { id: number; qty: number }[] };
  Sentry.setTag('cart.size', items.length);

  const inventory = await getInventory(items.map((i) => i.id));
  for (const item of items) {
    const stock = inventory.find((s) => s.productId === item.id)?.count ?? 0;
    if (stock < item.qty) {
      // Thrown (not returned) so Sentry records an unhandled server error.
      throw new Error(`Not enough inventory for product ${item.id}`);
    }
  }

  await Sentry.startSpan({ op: 'function', name: 'checkout.process_order' }, async () => {
    for (const item of items) await decrementInventory(item.id, item.qty);
  });

  Sentry.logger.info('Order placed', { items: items.length });
  return Response.json({ orderId: crypto.randomUUID().slice(0, 8) });
};
