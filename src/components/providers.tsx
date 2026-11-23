"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/lib/store";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateSession = useAppStore((s) => s.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            style: {
              background: "#1d1d1f",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "18px",
              fontSize: "13px",
              padding: "12px 16px",
              boxShadow: "3px 5px 30px rgba(0,0,0,0.22)",
            },
          }}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}
