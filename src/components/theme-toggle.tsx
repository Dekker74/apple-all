"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  showLabel = false,
  className,
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Attiva modalità chiara" : "Attiva modalità scura";

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={cn(showLabel && "gap-2", className)}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {showLabel ? <span>{isDark ? "Modalità chiara" : "Modalità scura"}</span> : null}
    </Button>
  );
}
