// CLIENT ISLAND (client:visible). Its button HTML is server-rendered with the
// page; React only downloads + hydrates once it scrolls into view.
import { useState } from 'react';
import { addToCart } from '../lib/cart';

type Props = { id: number; title: string; price: number; img: string };

export default function AddToCart(props: Props) {
  const [added, setAdded] = useState(false);
  return (
    <button
      className="btn"
      onClick={() => {
        addToCart(props);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? 'Added ✓' : 'Add to cart'}
    </button>
  );
}
