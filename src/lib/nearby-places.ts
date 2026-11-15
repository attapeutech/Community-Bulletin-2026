// Server only. Nearby-business finder for Sales: businesses around a store from Google Places API (New),
// to add as advertiser leads. Key: GOOGLE_PLACES_API_KEY (.env.local and Coolify), restricted to
// "Places API (New)". Each run is ~3 Nearby Search calls + 1 Text Search to place the store.

const API = "https://places.googleapis.com/v1";
const MILE_M = 1609;

export type NearbyBusiness = {
  placeId: string;
  name: string;
  category: string | null;        // Google's type label, e.g. "Mexican Restaurant"
  address: string | null;
  phone: string | null;
  website: string | null;
  distanceMi: number;
  chain: boolean;                 // matched our list of big national chains
};

export class PlacesError extends Error {}

export const placesConfigured = () => !!process.env.GOOGLE_PLACES_API_KEY;

async function call<T>(path: string, body: object, fieldMask: string): Promise<T> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new PlacesError("GOOGLE_PLACES_API_KEY isn't set on the server");
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    throw new PlacesError(`Google Places: ${msg}`);
  }
  return json as T;
}

type GPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryTypeDisplayName?: { text?: string };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude: number; longitude: number };
  businessStatus?: string;
};

// Where the store is (cached per server process: a store's address rarely changes)
const storeSpot = new Map<string, { lat: number; lng: number }>();
async function locate(address: string) {
  const hit = storeSpot.get(address);
  if (hit) return hit;
  const r = await call<{ places?: GPlace[] }>("places:searchText", { textQuery: address, pageSize: 1 }, "places.location");
  const loc = r.places?.[0]?.location;
  if (!loc) throw new PlacesError("Couldn't find the store's address on Google Maps");
  const spot = { lat: loc.latitude, lng: loc.longitude };
  storeSpot.set(address, spot);
  return spot;
}

function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Nearby Search returns at most 20 per call, so look in a few groups of business types that tend to buy
// local ads, then merge. (Table A types from the Places API.)
const TYPE_GROUPS: string[][] = [
  ["restaurant", "cafe", "bakery", "meal_takeaway", "bar", "ice_cream_shop", "sandwich_shop", "pizza_restaurant"],
  ["beauty_salon", "hair_care", "nail_salon", "barber_shop", "spa", "gym", "dentist", "doctor", "chiropractor", "physiotherapist", "veterinary_care", "pet_store"],
  ["car_repair", "car_wash", "car_dealer", "furniture_store", "clothing_store", "florist", "real_estate_agency", "insurance_agency", "laundry", "storage", "hardware_store", "electronics_store", "accounting", "child_care_agency"],
];

// Big national chains: they rarely buy a $100 local screen ad (corporate decides). Shown with "Show chains".
const CHAINS = [
  "mcdonald", "burger king", "wendy", "taco bell", "subway", "starbucks", "dunkin", "domino", "pizza hut", "papa john",
  "little caesars", "kfc", "chipotle", "panda express", "jack in the box", "carl's jr", "arby", "popeyes", "chick-fil-a",
  "dairy queen", "sonic drive", "five guys", "panera", "olive garden", "applebee", "denny", "ihop", "red robin", "jamba",
  "walmart", "target", "costco", "safeway", "fred meyer", "albertsons", "qfc", "walgreens", "cvs", "rite aid", "7-eleven",
  "home depot", "lowe's", "best buy", "petco", "petsmart", "ross dress", "tj maxx", "marshalls", "goodwill", "dollar tree",
  "dollar general", "big 5", "autozone", "o'reilly", "napa auto", "jiffy lube", "les schwab", "discount tire", "midas", "firestone", "goodyear", "valvoline", "pep boys", "meineke", "maaco",
  "great clips", "supercuts", "sport clips", "planet fitness", "24 hour fitness", "la fitness", "h&r block", "jackson hewitt",
  "state farm", "allstate", "farmers insurance", "bank of america", "chase", "wells fargo", "us bank", "u.s. bank",
  "keybank", "boeing employees", "becu", "verizon", "t-mobile", "at&t", "ups store", "fedex", "usps", "post office",
  "shell", "chevron", "arco", "76", "texaco", "exxon", "mobil", "safelite", "enterprise rent", "hertz", "u-haul",
];
const isChain = (name: string) => {
  const n = name.toLowerCase();
  return CHAINS.some((c) => (c.length <= 3 ? new RegExp(`\\b${c}\\b`).test(n) : n.includes(c)));
};

const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.primaryTypeDisplayName",
  "places.nationalPhoneNumber", "places.websiteUri", "places.location", "places.businessStatus",
].join(",");

/** Up to `limit` open businesses within `radiusMi` of the store, closest first (chains flagged) */
export async function findNearby(storeAddress: string, radiusMi = 1, limit = 60): Promise<NearbyBusiness[]> {
  const spot = await locate(storeAddress);
  const results = await Promise.all(TYPE_GROUPS.map((types) =>
    call<{ places?: GPlace[] }>("places:searchNearby", {
      includedTypes: types,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center: { latitude: spot.lat, longitude: spot.lng }, radius: Math.round(radiusMi * MILE_M) } },
    }, FIELDS)
  ));

  const seen = new Map<string, NearbyBusiness>();
  for (const r of results) {
    for (const p of r.places ?? []) {
      if (!p.id || seen.has(p.id) || !p.displayName?.text || !p.location) continue;
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      const name = p.displayName.text;
      seen.set(p.id, {
        placeId: p.id,
        name,
        category: p.primaryTypeDisplayName?.text ?? null,
        address: p.formattedAddress?.replace(/, (USA|United States)$/, "") ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        distanceMi: Math.round(miles(spot, { lat: p.location.latitude, lng: p.location.longitude }) * 100) / 100,
        chain: isChain(name),
      });
    }
  }
  return [...seen.values()].sort((a, b) => a.distanceMi - b.distanceMi).slice(0, limit);
}
