import { CATEGORY_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MaterialCategory } from "@/types";
import { CategoryIcon } from "./category-icon";

const GRADIENTS: Record<MaterialCategory, string> = {
  paper_cardboard: "from-[#E8DFC9] via-[#DCD2B8] to-[#C9BC9A]",
  wood: "from-[#DCCDB2] via-[#C9B48F] to-[#A98F68]",
  plastic: "from-[#CFE0D4] via-[#AECBB9] to-[#7FA793]",
};

export function MaterialThumb({
  category,
  reference,
  photos,
  className,
  compact = false,
}: {
  category: MaterialCategory;
  reference: string;
  photos?: string[];
  className?: string;
  compact?: boolean;
}) {
  const meta = CATEGORY_MAP[category];
  if (photos && photos.length > 0) {
    return (
      <div className={cn("relative overflow-hidden bg-sand", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-full bg-ink/60 px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-paper backdrop-blur">
          {meta.short}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        GRADIENTS[category],
        className,
      )}
    >
      <div className="absolute inset-0 dot-grid opacity-[0.35]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,255,255,0.5),transparent_55%)]" />
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-6 -right-2 select-none font-display leading-none text-ink/15",
          compact ? "text-[74px]" : "text-[120px]",
        )}
      >
        {meta.glyph}
      </span>
      <div className="relative flex h-full flex-col justify-between p-3">
        <CategoryIcon category={category} size="sm" className="border-white/40 bg-white/50 backdrop-blur" />
        <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink/55">
          {reference}
        </span>
      </div>
    </div>
  );
}
