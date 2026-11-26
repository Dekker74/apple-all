"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ListingStatus, RequestStatus } from "@/types";
import {
  LISTING_STATUS_COPY,
  REQUEST_STATUS_COPY,
  STATUS_TONE,
  localLabel,
} from "./form-copy";

export function StatusPill({
  kind,
  status,
  className,
}: {
  kind: "listing" | "request";
  status: ListingStatus | RequestStatus | string;
  className?: string;
}) {
  const { lang } = useI18n();
  const label =
    kind === "listing"
      ? localLabel(LISTING_STATUS_COPY[status as ListingStatus], lang)
      : localLabel(REQUEST_STATUS_COPY[status as RequestStatus], lang);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
        STATUS_TONE[status] ?? "border-line bg-paper text-muted",
        className,
      )}
    >
      {label}
    </span>
  );
}
