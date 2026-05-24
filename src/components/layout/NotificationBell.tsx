"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, Check, BellOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  reportId: string | null;
  createdAt: string;
};

type ApiResponse = { notifications: Notification[]; unreadCount: number };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data, mutate } = useSWR<ApiResponse>("/api/notifications", fetcher, {
    refreshInterval: 30000,
  });

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    mutate();
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      // Mark all read when opening
      setTimeout(() => {
        markAllRead();
      }, 1500);
    }
  }

  function handleNotifClick(notif: Notification) {
    setOpen(false);
    if (notif.reportId) router.push(`/reports/${notif.reportId}`);
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger
        className={`${buttonVariants({ variant: "ghost", size: "icon" })} relative`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <BellOff className="h-6 w-6" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex flex-col items-start gap-0.5 py-3 px-3 cursor-pointer ${
                    !notif.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span className={`text-sm font-medium leading-tight ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                      {notif.title}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: roLocale })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug pl-4 line-clamp-2">
                    {notif.message}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={markAllRead} className="text-xs text-muted-foreground justify-center gap-1">
              <Check className="h-3 w-3" />
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
