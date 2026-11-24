export type MaterialCategory = "paper_cardboard" | "wood" | "plastic";

export type MaterialCondition = "clean" | "mixed" | "needs_processing";

export type ProcessingType =
  | "sorting"
  | "washing"
  | "shredding"
  | "pelletizing"
  | "deinking"
  | "drying"
  | "baling";

export type OrgType = "supplier" | "buyer" | "both";

export type AccountRole = "business" | "individual";

export type MemberRole = "owner" | "admin" | "member";

export type ListingStatus = "draft" | "active" | "matched" | "reserved" | "sold" | "archived";

export type RequestStatus = "draft" | "open" | "matched" | "fulfilled" | "closed";

export type MatchConfidence = "strong" | "review" | "weak";

export type MatchStatus = "suggested" | "shortlisted" | "dismissed" | "quoted";

export type OrderStatus =
  | "draft"
  | "matched"
  | "quote_issued"
  | "quote_accepted"
  | "collection_scheduled"
  | "completed"
  | "cancelled";

export type QuoteStatus = "issued" | "accepted" | "declined" | "expired";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  accountRole: AccountRole;
  jobTitle?: string;
  onboarded: boolean;
  createdAt: string;
}

export interface DemoAccount {
  userId: string;
  email: string;
  isDemo: boolean;
  companyName?: string;
  passwordHash?: string;
  passwordSalt?: string;
}

export interface Organization {
  id: string;
  name: string;
  vatNumber: string;
  country: string;
  website?: string;
  type: OrgType;
  verified: boolean;
  createdAt: string;
  description?: string;
}

export interface Location {
  id: string;
  orgId: string;
  name: string;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  isPrimary: boolean;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: MemberRole;
  fullName: string;
  email: string;
  title?: string;
  status: "active" | "invited";
  joinedAt: string;
}

export interface CompositionPart {
  material: string;
  percent: number;
}

export interface MaterialListing {
  id: string;
  reference: string;
  orgId: string;
  locationId: string;
  title: string;
  description: string;
  category: MaterialCategory;
  composition: CompositionPart[];
  quantityKg: number;
  condition: MaterialCondition;
  /** All condition statements chosen by the seller. Older seeds omit it. */
  conditionFlags?: MaterialCondition[];
  /** Kept for the matching engine; derived from conditionFlags, never exposed in forms. */
  purityPct: number;
  pricePerKg: number;
  currency: "EUR";
  availableFrom: string;
  availableUntil: string;
  photos: string[];
  handling: string[];
  packaging: string;
  minOrderKg: number;
  status: ListingStatus;
  createdAt: string;
  views: number;
}

export interface QualityThresholds {
  minPurityPct: number;
  maxMoisturePct: number;
  maxContaminationPct: number;
}

export interface MaterialRequest {
  id: string;
  reference: string;
  orgId: string;
  locationId: string;
  title: string;
  description: string;
  category: MaterialCategory;
  acceptableComposition: string[];
  /** Buyer-selected conditions. Older seeds omit it. */
  acceptedConditions?: MaterialCondition[];
  qualityThresholds: QualityThresholds;
  quantityKg: number;
  frequency: "one_off" | "monthly" | "quarterly";
  maxBudget: number;
  requiredProcessing: ProcessingType[];
  neededBy: string;
  radiusKm: number;
  status: RequestStatus;
  createdAt: string;
}

export interface PriceBreakdown {
  quantityKg: number;
  materialCost: number;
  processingCost: number;
  transportCost: number;
  commissionRate: number;
  commissionAmount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  deliveredPerKg: number;
  materialPerKg: number;
}

export interface Match {
  id: string;
  listingId: string;
  requestId: string;
  score: number;
  confidence: MatchConfidence;
  reasons: string[];
  risks: string[];
  requiredProcessing: ProcessingType[];
  distanceKm: number;
  quantityKg: number;
  breakdown: PriceBreakdown;
  status: MatchStatus;
  createdAt: string;
}

export interface Quote {
  id: string;
  orderId: string;
  breakdown: PriceBreakdown;
  validUntil: string;
  status: QuoteStatus;
  issuedAt: string;
  notes?: string;
}

export interface OrderEvent {
  id: string;
  at: string;
  label: string;
  note?: string;
  actor: string;
  kind: "system" | "user" | "partner" | "finance";
}

export interface CollectionPlan {
  windowStart: string;
  windowEnd: string;
  transportPartnerId: string;
  processingPartnerId: string;
  qcPartnerId: string;
  qcStatus: "pending" | "scheduled" | "passed" | "failed";
  instructions?: string;
}

export interface Order {
  id: string;
  reference: string;
  buyerOrgId: string;
  supplierOrgId: string;
  listingId: string;
  requestId: string;
  matchId: string;
  quoteId: string | null;
  quantityKg: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  collection: CollectionPlan | null;
  timeline: OrderEvent[];
  createdByUserId: string;
}

export interface Partner {
  id: string;
  name: string;
  kind: "processing" | "transport" | "qc";
  coverage: string;
  rating: number;
  onTimePct: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
  tone: "info" | "success" | "warning";
}
