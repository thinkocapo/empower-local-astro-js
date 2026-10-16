// Browser-only cart store (localStorage). Shared by the React islands.
export type CartItem = { id: number; title: string; price: number; img: string; qty: number };
const KEY = 'empower-astro-cart';
const EVT = 'cart:change';

export function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

export function addToCart(item: Omit<CartItem, 'qty'>) {
  const items = readCart();
  const existing = items.find((i) => i.id === item.id);
  if (existing) existing.qty += 1;
  else items.push({ ...item, qty: 1 });
  writeCart(items);
}

export function onCartChange(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}
