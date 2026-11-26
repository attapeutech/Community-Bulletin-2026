import type {
  Ad,
  User,
  Location,
  Payment,
  Notification,
  Country,
  State,
  City,
  PostalCode,
} from "@/lib/db/schema";

// ─── Ad with relations ───────────────────────────────────────────────────────
export type AdWithRelations = Ad & {
  user: Pick<User, "id" | "name" | "email">;
  location: LocationWithRelations;
  payments?: Payment[];
};

// ─── Location with full address relations ────────────────────────────────────
export type LocationWithRelations = Location & {
  country: Country;
  state: State;
  city: City;
  postalCode: PostalCode;
  storeOwner?: Pick<User, "id" | "name" | "email">;
};

// ─── Dashboard pagination ────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdFilters {
  status?: Ad["status"];
  paymentStatus?: Ad["paymentStatus"];
  locationId?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─── API response wrapper ────────────────────────────────────────────────────
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// ─── Ad status / payment status labels ──────────────────────────────────────
export const AD_STATUS_LABELS: Record<Ad["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<Ad["paymentStatus"], string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
  refund_pending: "Refund Pending",
  failed: "Failed",
};

export const AD_PRICE_CENTS = 10000; // $100.00
export const AD_DURATION_DAYS = 28;   // one paid run = 4 weeks; locations are priced per run
export const LOCAL_AD_RADIUS_MILES = 10; // ads are for businesses near the store (or serving its area); farther ones may be denied
// Location pricing and revenue share — admin-controlled, enforced by the locations API
export const MIN_PRICE_PER_RUN_CENTS = 1000;    // $10
export const MAX_PRICE_PER_RUN_CENTS = 100000;  // $1,000
// Store owner share (since 2026-11-15): 50% when the store provides the TV, mini PC and WiFi; 25% when
// Community Bulletin supplies and installs the equipment. Admins can still set any rate per store.
export const SHARE_OWN_EQUIPMENT_BPS = 5000;     // 50%
export const SHARE_WE_SUPPLY_BPS = 2500;         // 25%
export const DEFAULT_SHARE_RATE_BPS = SHARE_OWN_EQUIPMENT_BPS; // stores owners create themselves (admins confirm)
export const MAX_SHARE_RATE_BPS = 9000;          // 90%
// Card fee taken from the store owner's share (since 2026-11-26): 2.9% of their share + 30¢ per ad.
// E.g. a $50.00 share: $1.45 + $0.30 = $1.75, so they earn $48.25. Community Bulletin pays the rest of Stripe's fee.
export const STORE_CARD_FEE_BPS = 290;           // 2.9%
export const STORE_CARD_FEE_FIXED_CENTS = 30;    // $0.30
export const MIN_PAYOUT_CENTS = 2500; // $25 — smaller owner balances roll over to next month
