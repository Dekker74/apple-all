"use client";

import { RotateCcw, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatLocalTime } from "./local-format";
import { useLocalCopy } from "./use-local-copy";

const COPY = {
  it: {
    saved: (time: string) => `Bozza salvata in questo browser alle ${time}`,
    restored: "Bozza ripristinata da questo browser",
    restart: "Ricomincia",
    scope: "Salvataggio locale, non pubblicato",
    editing: "Modifica di un annuncio esistente",
    editingScope: "Le modifiche saranno applicate all'annuncio",
    cancelEdit: "Annulla modifica",
  },
  en: {
    saved: (time: string) => `Draft saved in this browser at ${time}`,
    restored: "Draft restored from this browser",
    restart: "Start over",
    scope: "Local save, not published",
    editing: "Editing an existing listing",
    editingScope: "Changes will be applied to the listing",
    cancelEdit: "Cancel edit",
  },
} as const;

export function DraftStatus({
  savedAt,
  restored,
  onReset,
  editing = false,
}: {
  savedAt: string | null;
  restored: boolean;
  onReset: () => void;
  editing?: boolean;
}) {
  const copy = useLocalCopy(COPY);
  const { lang } = useI18n();
  if (!savedAt && !restored && !editing) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper/60 px-3 py-2 text-[11.5px] text-muted">
      <span className="flex items-center gap-1.5">
        <Save className="size-3.5 shrink-0 text-moss" />
        <span>
          {editing
            ? copy.editing
            : restored
              ? copy.restored
              : copy.saved(formatLocalTime(savedAt ?? "", lang))}
          <span className="ml-1.5 text-muted/80">
            · {editing ? copy.editingScope : copy.scope}
          </span>
        </span>
      </span>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-moss hover:bg-mist motion-reduce:transition-none"
      >
        <RotateCcw className="size-3" /> {editing ? copy.cancelEdit : copy.restart}
      </button>
    </div>
  );
}
