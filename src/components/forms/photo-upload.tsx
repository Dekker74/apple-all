"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InlineError } from "./inline-error";
import { useLocalCopy } from "./use-local-copy";

const PHOTO_COPY = {
  it: {
    add: "Aggiungi foto",
    remove: (index: number) => `Rimuovi foto ${index + 1}`,
    uploading: "Elaborazione…",
    drag: "Trascina qui le foto",
    full: "Hai raggiunto il limite di foto.",
    invalid: "Scegli immagini JPEG, PNG o WebP di massimo 8 MB.",
    partial: "Alcuni file non sono immagini valide e sono stati ignorati.",
    tooMany: "Puoi caricare al massimo {n} foto.",
    readError: "Impossibile leggere quell'immagine. Prova con un altro file.",
    addedOne: "Foto aggiunta all'annuncio.",
    addedMany: "Foto aggiunte all'annuncio.",
  },
  en: {
    add: "Add photo",
    remove: (index: number) => `Remove photo ${index + 1}`,
    uploading: "Processing…",
    drag: "Drop photos here",
    full: "You have reached the photo limit.",
    invalid: "Choose JPEG, PNG or WebP images up to 8 MB.",
    partial: "Some files were not valid images and were skipped.",
    tooMany: "You can upload up to {n} photos.",
    readError: "That image could not be read. Try another file.",
    addedOne: "Photo added to the listing.",
    addedMany: "Photos added to the listing.",
  },
} as const;

const MAX_BYTES = 8_000_000;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_WIDTH = 1000;

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  label,
  hint,
  error,
  max = 3,
}: {
  photos: string[];
  onAdd: (dataUrls: string[]) => void;
  onRemove: (index: number) => void;
  label: string;
  hint?: string;
  error?: string;
  max?: number;
}) {
  const copy = useLocalCopy(PHOTO_COPY);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const errorId = "photos-error";

  async function handleFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    if (photos.length >= max) {
      toast.error(copy.full);
      return;
    }
    const remaining = max - photos.length;
    if (files.length > remaining) {
      toast.error(copy.tooMany.replace("{n}", String(max)));
    }
    const candidates = Array.from(files).slice(0, remaining);
    const valid = candidates.filter(
      (file) => ACCEPTED.includes(file.type) && file.size <= MAX_BYTES,
    );
    if (valid.length === 0) {
      toast.error(copy.invalid);
      return;
    }
    if (valid.length < candidates.length) toast.error(copy.partial);
    setBusy(true);
    try {
      const compressed = await Promise.all(valid.map((file) => compressImage(file)));
      onAdd(compressed);
      toast.success(compressed.length === 1 ? copy.addedOne : copy.addedMany);
    } catch {
      toast.error(copy.readError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="field-label">{label}</p>
        <span className="font-mono text-[12px] text-muted">
          {photos.length}/{max}
        </span>
      </div>
      {hint ? <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{hint}</p> : null}
      <div
        role="group"
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "mt-2.5 grid grid-cols-3 gap-2 rounded-xl transition-colors motion-reduce:transition-none",
          dragging && "ring-2 ring-moss/40",
        )}
      >
        {photos.map((photo, index) => (
          <div
            key={`${index}-${photo.slice(0, 24)}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-sand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={copy.remove(index)}
              className="absolute right-1.5 top-1.5 flex size-11 items-center justify-center rounded-full bg-ink/75 text-paper transition-opacity motion-reduce:transition-none sm:size-7 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max ? (
          <label
            className={cn(
              "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-paper/60 px-1 text-center text-muted transition-colors hover:border-sage hover:text-forest focus-within:ring-2 focus-within:ring-moss/40 motion-reduce:transition-none",
              dragging && "border-moss text-forest",
            )}
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-[11.5px] leading-tight">
              {busy ? copy.uploading : copy.add}
            </span>
            <span className="hidden text-[11px] text-muted sm:block">{copy.drag}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = "";
              }}
              disabled={busy}
              aria-label={label}
            />
          </label>
        ) : null}
      </div>
      <InlineError id={errorId}>{error}</InlineError>
    </div>
  );
}
