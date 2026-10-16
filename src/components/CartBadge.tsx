// CLIENT ISLAND (client:load). The server/build emits an empty badge; React
// hydrates it in the browser and reads the cart from localStorage.
import { useEffect, useState } from 'react';
import { onCartChange, readCart } from '../lib/cart';

export default function CartBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => setCount(readCart().reduce((n, i) => n + i.qty, 0));
    sync();
    return onCartChange(sync);
  }, []);
  return <span className="badge">{count}</span>;
}
