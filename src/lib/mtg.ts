export type ProductType = "single" | "booster" | "commander" | "accessory";

export type Store = {
  id: string;
  name: string;
  blurb: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  hours: string;
  phone: string;
  tags: string[];
  events: { day: string; name: string; format: string }[];
};

export type Listing = {
  storeId: string;
  price: number;
  stock: number;
  condition: string;
  updatedMinutesAgo: number;
};

export type Product = {
  id: string;
  name: string;
  type: ProductType;
  set: string;
  setCode: string;
  rarity: "common" | "uncommon" | "rare" | "mythic" | "special";
  colors: string[];
  typeLine: string;
  oracle: string;
  image: string;
  msrp: number;
};

export const STORES: Store[] = [
  {
    id: "arcane-vault",
    name: "The Arcane Vault",
    blurb: "Competitive hub with the deepest singles binder in the district.",
    address: "48 Duxton Road",
    city: "Downtown",
    lat: 1.2795,
    lng: 103.8425,
    rating: 4.8,
    reviews: 412,
    hours: "11:00 – 22:00",
    phone: "+65 6221 4480",
    tags: ["Singles", "Tournaments", "Grading"],
    events: [
      { day: "Fri", name: "Friday Night Magic", format: "Standard" },
      { day: "Sat", name: "Commander Chaos", format: "EDH" },
      { day: "Sun", name: "Draft League", format: "Booster Draft" },
    ],
  },
  {
    id: "gilded-goblin",
    name: "Gilded Goblin Games",
    blurb: "Family-run shop famous for sealed product deals and big play space.",
    address: "12 Tanjong Pagar Plaza",
    city: "Tanjong Pagar",
    lat: 1.2757,
    lng: 103.8438,
    rating: 4.6,
    reviews: 288,
    hours: "12:00 – 21:00",
    phone: "+65 6337 1290",
    tags: ["Sealed", "Casual", "Kids Table"],
    events: [
      { day: "Thu", name: "Pauper Night", format: "Pauper" },
      { day: "Sat", name: "Prerelease", format: "Sealed" },
    ],
  },
  {
    id: "planeswalk",
    name: "Planeswalk Collectibles",
    blurb: "Boutique store for reserved list rarities and graded slabs.",
    address: "301 Beach Road #02-11",
    city: "Bugis",
    lat: 1.3009,
    lng: 103.8607,
    rating: 4.9,
    reviews: 176,
    hours: "13:00 – 20:00",
    phone: "+65 6291 7742",
    tags: ["Rare", "Vintage", "Buylist"],
    events: [{ day: "Wed", name: "Legacy Legends", format: "Legacy" }],
  },
  {
    id: "mana-forge",
    name: "Mana Forge Tabletop",
    blurb: "Late-night café and game store with 24 tables and full snack bar.",
    address: "77 Kampong Bahru",
    city: "Outram",
    lat: 1.2731,
    lng: 103.8339,
    rating: 4.5,
    reviews: 523,
    hours: "10:00 – 01:00",
    phone: "+65 6444 8812",
    tags: ["Café", "Late Night", "Accessories"],
    events: [
      { day: "Tue", name: "Modern Mayhem", format: "Modern" },
      { day: "Fri", name: "Two-Headed Giant", format: "Casual" },
    ],
  },
  {
    id: "dragons-hoard",
    name: "Dragon's Hoard",
    blurb: "Accessory specialists — sleeves, decks boxes and playmats galore.",
    address: "5 Orchard Turn #04-09",
    city: "Orchard",
    lat: 1.3039,
    lng: 103.8318,
    rating: 4.3,
    reviews: 201,
    hours: "11:00 – 22:00",
    phone: "+65 6733 5566",
    tags: ["Accessories", "Playmats", "Sleeves"],
    events: [{ day: "Sun", name: "Sealed Scramble", format: "Sealed" }],
  },
  {
    id: "leyline-lounge",
    name: "Leyline Lounge",
    blurb: "Commander-first clubhouse with rotating precon rentals.",
    address: "160 Robinson Road",
    city: "Shenton Way",
    lat: 1.2782,
    lng: 103.8489,
    rating: 4.7,
    reviews: 149,
    hours: "12:00 – 23:00",
    phone: "+65 6019 3344",
    tags: ["Commander", "Precons", "Lounge"],
    events: [{ day: "Sat", name: "EDH Gauntlet", format: "Commander" }],
  },
];

const img = (id: string) => `https://cards.scryfall.io/normal/front/${id}.jpg`;

export const PRODUCTS: Product[] = [
  {
    id: "sol-ring",
    name: "Sol Ring",
    type: "single",
    set: "Commander Masters",
    setCode: "CMM",
    rarity: "uncommon",
    colors: ["C"],
    typeLine: "Artifact",
    oracle: "{T}: Add {C}{C}.",
    image: img("f/0/f0d1a1a3-4b8a-4ba9-9ac9-cfbb1e8e2c7f"),
    msrp: 3.5,
  },
  {
    id: "lightning-bolt",
    name: "Lightning Bolt",
    type: "single",
    set: "Modern Horizons 3",
    setCode: "MH3",
    rarity: "common",
    colors: ["R"],
    typeLine: "Instant",
    oracle: "Lightning Bolt deals 3 damage to any target.",
    image: img("9/6/9683d3ae-1a2e-4e5b-9a1b-2ec2ba1a2f74"),
    msrp: 2.2,
  },
  {
    id: "atraxa",
    name: "Atraxa, Praetors' Voice",
    type: "single",
    set: "Double Masters",
    setCode: "2XM",
    rarity: "mythic",
    colors: ["W", "U", "B", "G"],
    typeLine: "Legendary Creature — Phyrexian Angel Horror",
    oracle: "Flying, vigilance, deathtouch, lifelink. At the beginning of your end step, proliferate.",
    image: img("d/0/d0d33d52-3d28-4635-b985-51e126289259"),
    msrp: 24.0,
  },
  {
    id: "ragavan",
    name: "Ragavan, Nimble Pilferer",
    type: "single",
    set: "Modern Horizons 2",
    setCode: "MH2",
    rarity: "mythic",
    colors: ["R"],
    typeLine: "Legendary Creature — Monkey Pirate",
    oracle: "Whenever Ragavan deals combat damage to a player, create a Treasure token and exile the top card of that player's library.",
    image: img("a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d"),
    msrp: 48.0,
  },
  {
    id: "counterspell",
    name: "Counterspell",
    type: "single",
    set: "Modern Horizons 2",
    setCode: "MH2",
    rarity: "common",
    colors: ["U"],
    typeLine: "Instant",
    oracle: "Counter target spell.",
    image: img("1/9/1920dae4-fb92-4f19-ade7-458dd23b4aa9"),
    msrp: 1.8,
  },
  {
    id: "sheoldred",
    name: "Sheoldred, the Apocalypse",
    type: "single",
    set: "Dominaria United",
    setCode: "DMU",
    rarity: "mythic",
    colors: ["B"],
    typeLine: "Legendary Creature — Phyrexian Praetor",
    oracle: "Deathtouch. Whenever you draw a card, you gain 2 life. Whenever an opponent draws a card, they lose 2 life.",
    image: img("d/6/d67be074-cdd4-41d9-ac89-0a0456c4e4b2"),
    msrp: 62.0,
  },
  {
    id: "bloomburrow-play",
    name: "Bloomburrow Play Booster Box",
    type: "booster",
    set: "Bloomburrow",
    setCode: "BLB",
    rarity: "special",
    colors: [],
    typeLine: "Sealed — 36 Play Boosters",
    oracle: "36 Play Boosters of the woodland plane of Bloomburrow.",
    image: img("7/8/78c8dc22-c9d9-4e3a-a4d2-f1dd6b3d3b78"),
    msrp: 132.0,
  },
  {
    id: "mh3-collector",
    name: "Modern Horizons 3 Collector Booster",
    type: "booster",
    set: "Modern Horizons 3",
    setCode: "MH3",
    rarity: "special",
    colors: [],
    typeLine: "Sealed — Collector Booster",
    oracle: "Foils, borderless treatments and serialized chase cards.",
    image: img("2/7/27c66cbc-1e0f-4dd6-b3c3-fd6b1e6f9f2f"),
    msrp: 34.0,
  },
  {
    id: "edh-eldrazi",
    name: "Eldrazi Unbound Commander Deck",
    type: "commander",
    set: "Modern Horizons 3",
    setCode: "MH3",
    rarity: "special",
    colors: ["C"],
    typeLine: "Sealed — 100 Card Commander Deck",
    oracle: "Colorless ramp precon led by Ulalek, Fused Atrocity.",
    image: img("5/9/5942e3a2-3a04-4b5e-9c1e-1b8fef2eb4f5"),
    msrp: 44.0,
  },
  {
    id: "edh-squirreled",
    name: "Squirreled Away Commander Deck",
    type: "commander",
    set: "Bloomburrow",
    setCode: "BLB",
    rarity: "special",
    colors: ["B", "G"],
    typeLine: "Sealed — 100 Card Commander Deck",
    oracle: "Golgari token swarm precon with two foil commanders.",
    image: img("3/1/31d3e0f0-84b9-4a0b-8f5b-25b1a3a54a4b"),
    msrp: 42.0,
  },
  {
    id: "dragon-shield",
    name: "Dragon Shield Matte Sleeves (100)",
    type: "accessory",
    set: "Accessories",
    setCode: "ACC",
    rarity: "special",
    colors: [],
    typeLine: "Accessory — Sleeves",
    oracle: "Standard size matte sleeves, 100 count. Tournament legal.",
    image: img("4/4/44f8b1b3-2f2b-4a97-9b32-1f0f3f0d1a1d"),
    msrp: 12.9,
  },
  {
    id: "playmat-arcane",
    name: "Arcane Sigil Playmat",
    type: "accessory",
    set: "Accessories",
    setCode: "ACC",
    rarity: "special",
    colors: [],
    typeLine: "Accessory — Playmat",
    oracle: "Stitched-edge rubber playmat, 24 x 14 inches.",
    image: img("6/2/62b4e4ab-1a4f-4a9a-9a3f-9f8d0a9c8e11"),
    msrp: 29.0,
  },
];

export const FEATURED_SETS = [
  { code: "BLB", name: "Bloomburrow", released: "2024", hue: "155" },
  { code: "MH3", name: "Modern Horizons 3", released: "2024", hue: "262" },
  { code: "DMU", name: "Dominaria United", released: "2022", hue: "86" },
  { code: "CMM", name: "Commander Masters", released: "2023", hue: "295" },
  { code: "2XM", name: "Double Masters", released: "2020", hue: "25" },
];

export const COLOR_META: Record<string, { label: string; hue: string }> = {
  W: { label: "White", hue: "86" },
  U: { label: "Blue", hue: "255" },
  B: { label: "Black", hue: "300" },
  R: { label: "Red", hue: "27" },
  G: { label: "Green", hue: "150" },
  C: { label: "Colorless", hue: "285" },
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  single: "Singles",
  booster: "Boosters",
  commander: "Commander",
  accessory: "Accessories",
};

/* deterministic pseudo-random so inventory stays stable between renders */
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
const rand = (seed: string) => (hash(seed) % 1000) / 1000;

const CONDITIONS = ["Near Mint", "Lightly Played", "Sealed", "Near Mint"];

export function listingsFor(productId: string): Listing[] {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return [];
  return STORES.filter((s) => rand(productId + s.id) > 0.22)
    .map((s) => {
      const r = rand(s.id + productId + "p");
      const stockRoll = rand(s.id + productId + "s");
      return {
        storeId: s.id,
        price: Math.round(product.msrp * (0.82 + r * 0.5) * 100) / 100,
        stock: stockRoll > 0.75 ? 0 : Math.ceil(stockRoll * 9),
        condition: product.type === "single" ? CONDITIONS[hash(s.id + productId) % 2]! : "Sealed",
        updatedMinutesAgo: 2 + (hash(s.id + productId) % 55),
      };
    })
    .sort((a, b) => a.price - b.price);
}

export function bestListing(productId: string) {
  const inStock = listingsFor(productId).filter((l) => l.stock > 0);
  return inStock[0] ?? null;
}

export const HOME_COORDS = { lat: 1.2865, lng: 103.845 };

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

export const storeById = (id: string) => STORES.find((s) => s.id === id);
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export function directionsUrl(store: Store) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${store.name}, ${store.address}, ${store.city}`,
  )}`;
}
