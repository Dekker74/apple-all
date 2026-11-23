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
              background: "#0B1B14",
              color: "#F6F5EF",
              border: "1px solid rgba(246,245,239,0.14)",
              borderRadius: "14px",
              fontSize: "13px",
              padding: "12px 16px",
            },
          }}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}
