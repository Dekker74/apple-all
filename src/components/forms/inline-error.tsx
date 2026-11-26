import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function InlineError({
  id,
  children,
  className,
}: {
  id?: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "flex items-start gap-1.5 text-[12px] font-medium leading-relaxed text-danger",
        className,
      )}
    >
      <CircleAlert className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
