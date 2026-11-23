import {
  LISTING_STATUS_META,
  ORDER_STATUS_META,
  REQUEST_STATUS_META,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ListingStatus, OrderStatus, RequestStatus } from "@/types";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
        meta.tone,
        className,
      )}
    >
      <span className="size-1 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

export function ListingStatusBadge({
  status,
  className,
}: {
  status: ListingStatus;
  className?: string;
}) {
  const meta = LISTING_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function RequestStatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const meta = REQUEST_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
