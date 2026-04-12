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
export const AD_DURATION_DAYS = 30;
