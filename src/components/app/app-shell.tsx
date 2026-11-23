import { AppNav } from "@/components/app/app-nav";
import { OffcutShell } from "@/components/offcut/shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <OffcutShell wide>
      <div className="offcut-app">
        <AppNav />
        <div className="offcut-app-content">{children}</div>
      </div>
    </OffcutShell>
  );
}
