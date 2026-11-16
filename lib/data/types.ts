/* khabo data shapes. These match the tables in docs/2-product/15-erd.md and the prototype data.
   Today they are filled from data/catalog/*.json. Later the same shapes come from Supabase. */

export type Lang = 'en' | 'bn';
/** a text in both languages */
export type Text = { en: string; bn: string };
/** a photo: a short id from the shared photo list, "pv:<room>:<view>" (a still from a 360 room),
    "ph:<id>" (a Poly Haven studio scan), or a full URL */
export type PhotoId = string;
export type Plan = 'premium' | 'pro' | 'starter';

export type Theme = { deep: string; accent: string; font: 'serif' | 'sans' };

export type Dish = {
  id: string;
  type: string;
  name: Text;
  price: number;
  p: PhotoId | null;
  por: Text;
  spice: number;
  cat: string;
  best?: boolean;
  d3?: string;
  veg?: boolean;
  desc?: Text;
  /** how many people one plate is for, when more than one */
  share?: number;
  video?: string;
  /** more photos and films of this dish, after the main photo (p) and main film (video).
      src is a photo id or a full address; the restaurant adds these in the owner panel */
  gallery?: DishMedia[];
  out?: boolean;
  /** portions with their own price (Full / Half, Regular / Large, 1 person / 2 people). The first is the usual
      plate: price equals its price and is what gets compared with other places. The diner picks a portion before
      adding it to the bill. The restaurant edits these in the owner panel */
  sizes?: DishSize[];
};
export type DishSize = { id: string; name: Text; price: number; por?: Text };
export type DishMedia = { kind: 'photo' | 'video'; src: string; poster?: string };

export type Deal = {
  id: string;
  en: string;
  bn: string;
  desc: Text;
  when: Text;
  price: number;
  was: number;
  p?: PhotoId;
  week?: boolean;
  tag?: string;
  from?: string;
  to?: string;
  off?: boolean;
  code?: string;
};

export type EventType = 'music' | 'match' | 'iftar' | 'festival' | 'other';
export type KhaboEvent = {
  id: string;
  en: string;
  bn: string;
  type: EventType;
  start: string;
  end: string;
  p?: PhotoId;
  desc: Text;
  price?: number;
};

export type TourSpot = { to?: string; info?: Text; yaw: number; pitch: number };
export type TourRoom = { id: string; en: string; bn: string; pano: string; day?: string; yaw?: number; spots?: TourSpot[]; img?: string; thumb?: string };

export type Review = {
  r: string;
  who: string;
  st: number;
  vf: boolean;
  when: Text;
  t: string;
  ord: string[];
  pics?: PhotoId[];
  reply?: Text;
  hidden?: boolean;
  /** set on reviews written in this browser */
  mine?: boolean;
  at?: number;
  dish?: string;
};

export type Film = { src: string; poster: PhotoId; len?: string };

export type Restaurant = {
  id: string;
  name: Text;
  mono: string;
  since?: number;
  area: string;
  city: string;
  geo: [number, number];
  spot: Text;
  address: Text;
  phone: string;
  cuisines: string[];
  theme: Theme;
  brand?: { logo?: string; shape?: string; box?: number[]; extra?: string };
  qr?: { look?: string; layout?: string; header?: string; theme?: string; color?: string };
  social?: { main?: string; links: Record<string, { url: string; n?: string }> };
  tagline: Text;
  story: Text;
  rating: number;
  reviews: number;
  verified: number;
  ppl: [number, number];
  hours: [string, string];
  vat: number;
  service: number;
  seats?: number;
  fac: string[];
  pay: string[];
  plan: Plan;
  featured?: boolean;
  founding?: boolean;
  checked: number;
  checkedAt?: number;
  mediaDate?: Text;
  hero: PhotoId[];
  film?: Film;
  kitchen?: { src: string; poster: PhotoId; date: Text; photos?: PhotoId[] };
  gallery: Partial<Record<'inside' | 'outside' | 'kitchen' | 'food', PhotoId[]>>;
  tour?: TourRoom[];
  signature?: string[];
  cats: { id: string; en: string; bn: string }[];
  menu: Dish[];
  deals?: Deal[];
  events?: KhaboEvent[];
  hidden?: boolean;
  look?: Record<string, string>;
  /** the owner's print menu choices (design, size, languages): see components/print/menu.tsx PmOpts */
  printMenu?: Record<string, unknown>;
};

/** what a restaurant card needs: no menu, no reviews */
export type RestaurantCard = Pick<Restaurant,
  'id' | 'name' | 'mono' | 'area' | 'city' | 'geo' | 'spot' | 'cuisines' | 'theme' | 'tagline' | 'rating' | 'reviews' | 'verified' | 'ppl' | 'hours'
  | 'fac' | 'plan' | 'featured' | 'founding' | 'checked' | 'hero' | 'phone'> & {
  hasTour: boolean; hasFilm: boolean; has3d: boolean; hasKitchen: boolean;
  deal?: Deal;
  /** dish types on the menu, for filters */
  types: string[];
  /** words used by search */
  hay: string;
  filmSrc?: string;
  vat: number;
  service: number;
};

/** a dish with the little it needs to know about its restaurant */
export type DishCard = Dish & { r: string; rest: RestaurantMini };
export type RestaurantMini = Pick<Restaurant, 'id' | 'name' | 'mono' | 'area' | 'city' | 'theme' | 'rating' | 'plan' | 'checked' | 'vat' | 'service' | 'hours'> & { featured?: boolean; spot?: Text };

export type Area = { id: string; city: string; en: string; bn: string; blurb: Text };
export type Cuisine = { id: string; en: string; bn: string; p: PhotoId | null };
export type DishType = { en: string; bn: string; cu: string; p?: PhotoId; i?: string; made?: Text };
export type Facility = { en: string; bn: string; i: string };
export type Occasion = { id: string; en: string; bn: string; i: string; q: { fac?: string[]; maxPP?: number; late?: boolean; media?: string[] } };
export type Budget = { id: string; en: string; bn: string; min?: number; max?: number };
export type Palette = { id: string; deep: string; accent: string; en: string; bn: string };

export type Common = {
  photos: Record<string, string>;
  films: Record<string, string>;
  palettes: Palette[];
  socials: Record<string, { en: string; base: string; icon: string; host: string }>;
  cities: Record<string, Text>;
  areas: Area[];
  soon: Text[];
  cuisines: Cuisine[];
  types: Record<string, DishType>;
  cravings: string[];
  facilities: Record<string, Facility>;
  occasions: Occasion[];
  budgets: Budget[];
  updated: Text;
  dealTags: Record<string, { en: string; bn: string; ring: string }>;
  tableMenu: { layouts: Record<string, string>; headers: Record<string, string>; themes: Record<string, string> };
  order: string[];
};

/** price history: "restaurant|dish" → [[day the price started, price], ...] */
export type PriceLog = Record<string, [string, number][]>;
