import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SparkBars({
  values,
  className,
  tone = "forest",
}: {
  values: number[];
  className?: string;
  tone?: "forest" | "lime" | "amber";
}) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex h-7 items-end gap-[3px]", className)} aria-hidden>
      {values.map((value, index) => (
        <span
          key={index}
          className={cn(
            "w-[4px] rounded-sm",
            tone === "forest" ? "bg-moss/50" : tone === "lime" ? "bg-lime" : "bg-amber/50",
            index === values.length - 1 && (tone === "forest" ? "bg-forest" : ""),
          )}
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  spark,
  accent,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down"; positive?: boolean };
  spark?: number[];
  accent?: "lime" | "amber" | "none";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-white p-4 sm:p-5",
        className,
      )}
    >
      {accent === "lime" ? (
        <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-[48px] bg-lime/20" />
      ) : null}
      <div className="relative flex items-start justify-between">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{label}</p>
        {Icon ? <Icon className="size-3.5 text-muted/70" strokeWidth={1.8} /> : null}
      </div>
      <p className="relative mt-3 font-display text-[32px] leading-none tracking-tight">{value}</p>
      <div className="relative mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-mono text-[11.5px]",
                trend.positive === false ? "text-clay" : "text-moss",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {trend.value}
            </span>
          ) : null}
          {sub ? <p className="mt-0.5 truncate text-[12px] text-muted">{sub}</p> : null}
        </div>
        {spark ? <SparkBars values={spark} tone={accent === "amber" ? "amber" : "forest"} /> : null}
      </div>
    </div>
  );
}
