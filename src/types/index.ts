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
export const DEFAULT_SHARE_RATE_BPS = 5000;      // 50% for every store owner (since 2026-10-29)
export const MAX_SHARE_RATE_BPS = 9000;          // 90%
export const MIN_PAYOUT_CENTS = 2500; // $25 — smaller owner balances roll over to next month
