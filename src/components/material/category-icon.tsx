import { Newspaper, Recycle, TreePine, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialCategory } from "@/types";

export const CATEGORY_ICONS: Record<MaterialCategory, LucideIcon> = {
  paper_cardboard: Newspaper,
  wood: TreePine,
  plastic: Recycle,
};

const TONES: Record<MaterialCategory, string> = {
  paper_cardboard: "bg-sand text-forest",
  wood: "bg-paper text-muted",
  plastic: "bg-mist text-forest",
};

export function CategoryIcon({
  category,
  size = "md",
  className,
}: {
  category: MaterialCategory;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category];
  const sizes = {
    sm: "size-7 rounded-lg [&_svg]:size-3.5",
    md: "size-9 rounded-xl [&_svg]:size-4",
    lg: "size-12 rounded-2xl [&_svg]:size-5",
  };
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-ink/[0.04]",
        TONES[category],
        sizes[size],
        className,
      )}
    >
      <Icon strokeWidth={1.7} />
    </span>
  );
}
