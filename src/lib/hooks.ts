"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Match, Order } from "@/types";

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function useCurrentUser() {
  const userId = useAppStore((s) => s.session.userId);
  const profiles = useAppStore((s) => s.profiles);
  return useMemo(() => profiles.find((p) => p.id === userId) ?? null, [profiles, userId]);
}

export function useCurrentOrg() {
  const currentOrgId = useAppStore((s) => s.currentOrgId);
  const organizations = useAppStore((s) => s.organizations);
  return useMemo(
    () => organizations.find((o) => o.id === currentOrgId) ?? null,
    [organizations, currentOrgId],
  );
}

export function useUserOrgs() {
  const userId = useAppStore((s) => s.session.userId);
  const memberships = useAppStore((s) => s.memberships);
  const organizations = useAppStore((s) => s.organizations);
  return useMemo(() => {
    const ids = new Set(
      memberships.filter((m) => m.userId === userId && m.status === "active").map((m) => m.orgId),
    );
    return organizations.filter((o) => ids.has(o.id));
  }, [memberships, organizations, userId]);
}

export function useOrgLocations(orgId?: string | null) {
  const currentOrgId = useAppStore((s) => s.currentOrgId);
  const locations = useAppStore((s) => s.locations);
  const id = orgId ?? currentOrgId;
  return useMemo(() => locations.filter((l) => l.orgId === id), [locations, id]);
}

export function usePrimaryLocation(orgId?: string | null) {
  const locations = useOrgLocations(orgId);
  return useMemo(
    () => locations.find((l) => l.isPrimary) ?? locations[0] ?? null,
    [locations],
  );
}

export function useOrgListings(orgId?: string | null) {
  const currentOrgId = useAppStore((s) => s.currentOrgId);
  const listings = useAppStore((s) => s.listings);
  const id = orgId ?? currentOrgId;
  return useMemo(() => listings.filter((l) => l.orgId === id), [listings, id]);
}

export function useOrgRequests(orgId?: string | null) {
  const currentOrgId = useAppStore((s) => s.currentOrgId);
  const requests = useAppStore((s) => s.requests);
  const id = orgId ?? currentOrgId;
  return useMemo(() => requests.filter((r) => r.orgId === id), [requests, id]);
}

export function useOrgOrders(orgId?: string | null) {
  const currentOrgId = useAppStore((s) => s.currentOrgId);
  const orders = useAppStore((s) => s.orders);
  const id = orgId ?? currentOrgId;
  return useMemo(
    () => orders.filter((o) => o.buyerOrgId === id || o.supplierOrgId === id),
    [orders, id],
  );
}

export interface MatchView {
  match: Match;
  direction: "demand" | "supply";
}

export function useMatchViews(): MatchView[] {
  const matches = useAppStore((s) => s.matches);
  const requests = useAppStore((s) => s.requests);
  const listings = useAppStore((s) => s.listings);
  const currentOrgId = useAppStore((s) => s.currentOrgId);

  return useMemo(() => {
    const requestOrg = new Map(requests.map((r) => [r.id, r.orgId]));
    const listingOrg = new Map(listings.map((l) => [l.id, l.orgId]));
    return matches
      .filter((m) => m.status !== "dismissed")
      .map<MatchView | null>((match) => {
        if (requestOrg.get(match.requestId) === currentOrgId) return { match, direction: "demand" };
        if (listingOrg.get(match.listingId) === currentOrgId) return { match, direction: "supply" };
        return null;
      })
      .filter((m): m is MatchView => Boolean(m))
      .sort((a, b) => b.match.score - a.match.score);
  }, [matches, requests, listings, currentOrgId]);
}

export function useOrderById(orderId: string) {
  const orders = useAppStore((s) => s.orders);
  return useMemo(() => orders.find((o) => o.id === orderId) ?? null, [orders, orderId]);
}

export function useListingById(listingId: string) {
  const listings = useAppStore((s) => s.listings);
  return useMemo(() => listings.find((l) => l.id === listingId) ?? null, [listings, listingId]);
}

export function useRequestById(requestId: string) {
  const requests = useAppStore((s) => s.requests);
  return useMemo(() => requests.find((r) => r.id === requestId) ?? null, [requests, requestId]);
}

export function useOrgName(orgId: string | null | undefined) {
  const organizations = useAppStore((s) => s.organizations);
  return useMemo(() => organizations.find((o) => o.id === orgId)?.name ?? "—", [organizations, orgId]);
}

export function useLocationName(locationId: string | null | undefined) {
  const locations = useAppStore((s) => s.locations);
  return useMemo(() => locations.find((l) => l.id === locationId)?.city ?? "—", [locations, locationId]);
}

export function useQuoteForOrder(orderId: string) {
  const orders = useAppStore((s) => s.orders);
  const quotes = useAppStore((s) => s.quotes);
  return useMemo(() => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.quoteId) return null;
    return quotes.find((q) => q.id === order.quoteId) ?? null;
  }, [orders, quotes, orderId]);
}

export function isOrderOpen(order: Order): boolean {
  return order.status !== "completed" && order.status !== "cancelled";
}
