import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={cn("size-8 text-moss", className)} role="img" aria-label="Offcut logo">
      <path d="M22 3 39 13v18L22 41 5 31V13L22 3Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M13 25c7-1 12-6 17-13 1 8-2 17-11 20-4 1-7-2-6-7Z" fill="currentColor" />
      <path d="M13 31c4-5 8-9 14-13" fill="none" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
