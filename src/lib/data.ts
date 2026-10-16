// Static catalog data. Imported by prerendered pages at BUILD time and by
// on-demand pages at REQUEST time (through the mocked queries in db.ts).
export type Review = { id: number; productId: number; rating: number; description: string; created: string };
export type Product = {
  id: number;
  title: string;
  description: string;
  descriptionfull: string;
  price: number;
  img: string;
  imgcropped: string;
};

export const PRODUCTS: Product[] = [
  {
    id: 3,
    title: 'Plant Mood',
    description: 'The mood ring for plants.',
    descriptionfull:
      'Plant Mood transforms plant care into an intuitive, visual experience. A soft-glow LED ring shifts color based on real-time soil moisture, light, and temperature so you always know how your plant is doing.',
    price: 155,
    img: '/product-images/mood-planter.jpg',
    imgcropped: '/product-images/mood-planter-cropped.jpg',
  },
  {
    id: 4,
    title: 'Botana Voice',
    description: 'Lets plants speak for themselves.',
    descriptionfull:
      "Botana Voice translates your plant's bioelectric signals into speech. Place the glass dome sensor nearby and hear needs like 'I'm thirsty' or 'Too much sun' in a voice personality of your choosing.",
    price: 175,
    img: '/product-images/plant-to-text.jpg',
    imgcropped: '/product-images/plant-to-text-cropped.jpg',
  },
  {
    id: 5,
    title: 'Plant Stroller',
    description: "Because plants don't have feet.",
    descriptionfull:
      'Plant Stroller is an autonomous platform that physically moves your potted plant to the best light through the day on eight articulated legs. Program patrol routes or let it chase the sun on its own.',
    price: 250,
    img: '/product-images/plant-spider.jpg',
    imgcropped: '/product-images/plant-spider-cropped.jpg',
  },
  {
    id: 6,
    title: 'Plant Nodes',
    description: 'Listen more carefully to your plants.',
    descriptionfull:
      'Plant Nodes are wireless soil sensors that measure moisture, pH, temperature, and light for every pot in your collection, relayed to a single dashboard through a self-forming mesh network.',
    price: 25,
    img: '/product-images/nodes.png',
    imgcropped: '/product-images/nodes-cropped.jpg',
  },
];

export const REVIEWS: Review[] = [
  { id: 1, productId: 3, rating: 5, description: 'Love the glow — I always know when to water now.', created: '2024-01-11' },
  { id: 2, productId: 3, rating: 4, description: 'Looks great on my desk.', created: '2024-02-02' },
  { id: 3, productId: 4, rating: 5, description: 'My fern finally talks back. 10/10.', created: '2024-01-20' },
  { id: 4, productId: 5, rating: 4, description: 'Watching it walk to the window never gets old.', created: '2024-03-05' },
  { id: 5, productId: 5, rating: 3, description: 'Startled the cat. Otherwise excellent.', created: '2024-03-09' },
  { id: 6, productId: 6, rating: 5, description: 'Great entry point for monitoring a whole shelf.', created: '2024-02-18' },
];
