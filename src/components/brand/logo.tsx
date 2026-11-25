import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/offcut-mark.svg" alt="Offcut" className={cn("brand-mark", className)} />
  );
}

export function Logo({
  className,
  variant = "dark",
  href = "/",
  showBeta = false,
}: {
  className?: string;
  variant?: "dark" | "light";
  href?: string;
  showBeta?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("brand inline-flex items-center gap-2.5", className)}
      aria-label="Offcut home"
    >
      <LogoMark className="size-[30px]" />
      <span className={cn("text-[17px] font-bold tracking-[-0.02em]", variant === "light" ? "text-paper" : "text-ink")}>
        Offcut
      </span>
      {showBeta ? (
        <span className="rounded-full border border-current/20 px-1.5 py-[1px] font-mono text-[12px] uppercase tracking-[0.14em] opacity-60">
          Beta
        </span>
      ) : null}
    </Link>
  );
}
