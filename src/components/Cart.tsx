// CLIENT-ONLY ISLAND (client:only="react"). Never rendered on the server or at
// build time — the cart lives in localStorage, which only exists in the browser.
// Checkout is a user interaction that calls the /api/checkout SSR endpoint, which
// calls Flask. Trace headers flow browser -> Astro -> Flask, so it's one trace.
import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/astro';
import { onCartChange, readCart, writeCart, type CartItem } from '../lib/cart';

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    return onCartChange(sync);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const setQty = (id: number, qty: number) =>
    writeCart(items.map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0));

  async function checkout() {
    setStatus('busy');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, title, price, qty }) => ({ id, title, price, qty })) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Checkout failed: ${res.status}`);
      writeCart([]);
      setStatus('done');
      setMessage(`Order ${body.orderId} placed.`);
    } catch (err) {
      Sentry.captureException(err);
      setStatus('error');
      setMessage((err as Error).message);
    }
  }

  if (status === 'done') return <p className="notice ok">{message}</p>;
  if (!items.length) return <p>Your cart is empty. <a href="/products">Browse products</a>.</p>;

  return (
    <div>
      <ul className="cart">
        {items.map((i) => (
          <li key={i.id}>
            <img src={i.img} alt="" />
            <span className="grow">{i.title}</span>
            <button className="btn small" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
            <span>{i.qty}</span>
            <button className="btn small" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
            <span className="price">${i.price * i.qty}</span>
          </li>
        ))}
      </ul>
      <p className="total">Total: ${total}</p>
      <button className="btn" disabled={status === 'busy'} onClick={checkout}>
        {status === 'busy' ? 'Placing order…' : 'Checkout'}
      </button>
      {status === 'error' && <p className="notice err">{message}</p>}
      <p className="muted small">Flask stocks only 8 Plant Strollers. Order 9+ to trigger a server error.</p>
    </div>
  );
}
