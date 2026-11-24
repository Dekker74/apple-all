"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<string, string> = {
  info: "bg-sky",
  success: "bg-moss",
  warning: "bg-amber",
};

export function NotificationMenu() {
  const { t } = useI18n();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("Notifiche")}>
          <Bell className="size-[18px]" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-clay font-mono text-[12px] text-white ring-2 ring-paper">
              {unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[13px] font-medium">{t("Notifiche")}</p>
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              {unread} unread
            </p>
          </div>
          <button
            onClick={markAll}
            className="flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-forest"
          >
            <CheckCheck className="size-3.5" /> {t("Segna tutti come letti")}
          </button>
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] text-muted">{t("Sei in pari con tutto.")}</p>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex gap-2.5 border-b border-line/60 px-4 py-3 transition-colors last:border-0 hover:bg-paper/70",
                  !n.read && "bg-lime/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    n.read ? "bg-line" : TONE_DOT[n.tone],
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium leading-[1.5] text-ink">{t(n.title)}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-muted">
                    {t(n.body)}
                  </span>
                  <span className="mt-1 block font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                    {t(relativeTime(n.createdAt))}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
