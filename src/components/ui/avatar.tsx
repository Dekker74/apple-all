import { cn, initials } from "@/lib/utils";

const COLORS = [
  "bg-forest text-paper",
  "bg-moss text-paper",
  "bg-clay text-paper",
  "bg-sky text-paper",
  "bg-amber text-paper",
  "bg-sage text-forest",
];

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLORS.length;
  const sizes = {
    xs: "size-6 text-[12px]",
    sm: "size-8 text-[11.5px]",
    md: "size-9 text-[12px]",
    lg: "size-12 text-sm",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-mono font-medium uppercase tracking-wide ring-1 ring-inset ring-white/15",
        COLORS[index],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
