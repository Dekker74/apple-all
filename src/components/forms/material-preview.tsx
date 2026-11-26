import { CategoryIcon } from "@/components/material/category-icon";
import { cn } from "@/lib/utils";
import type { MaterialCategory } from "@/types";

const SURFACES: Record<MaterialCategory, string> = {
  paper_cardboard: "bg-sand",
  wood: "bg-paper",
  plastic: "bg-mist",
};

/** Anteprima visiva senza testi: la copy resta sempre nelle pagine. */
export function MaterialPreview({
  category,
  photos,
  className,
  compact = false,
}: {
  category: MaterialCategory | "";
  photos?: string[];
  className?: string;
  compact?: boolean;
}) {
  const resolved = category || "paper_cardboard";
  const photo = photos?.[0];

  return (
    <div className={cn("relative overflow-hidden bg-sand", SURFACES[resolved], className)}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <CategoryIcon category={resolved} size={compact ? "md" : "lg"} />
        </div>
      )}
    </div>
  );
}
