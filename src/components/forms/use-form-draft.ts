"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Bozza locale del browser: nessuna chiamata API e nessuna modifica allo store. */
export function useFormDraft<T>(key: string, initial: T) {
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = false;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        if (parsed && typeof parsed === "object") {
          setValue(parsed);
          setRestored(true);
        }
      }
    } catch {
      // Una bozza corrotta non deve bloccare il form.
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded || pausedRef.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setSavedAt(new Date().toISOString());
    } catch {
      // Quota piena o storage non disponibile: il form resta utilizzabile.
    }
  }, [key, loaded, value]);

  const reset = useCallback(() => {
    pausedRef.current = false;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Vedi sopra.
    }
    setValue(initialRef.current);
    setRestored(false);
    setSavedAt(null);
  }, [key]);

  const clear = useCallback(() => {
    pausedRef.current = true;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Vedi sopra.
    }
    setRestored(false);
    setSavedAt(null);
  }, [key]);

  return { value, setValue, restored, savedAt, reset, clear };
}
