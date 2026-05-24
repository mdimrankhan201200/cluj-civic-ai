"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, LogOut, User, ShieldCheck, Settings } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const isGov = session?.user?.role === "GOVERNMENT_OFFICER" || session?.user?.role === "ADMIN";

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center px-4 gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-blue-700">
          <MapPin className="h-5 w-5" />
          <span className="hidden sm:block">{t.nav.appName}</span>
        </Link>

        <div className="flex-1" />

        {session?.user && <NotificationBell />}

        <LanguageSwitcher />

        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`${buttonVariants({ variant: "ghost", size: "icon" })} rounded-full`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{session.user.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <User className="h-4 w-4 mr-2" />
                {t.nav.myDashboard}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              {isGov && (
                <DropdownMenuItem onClick={() => router.push("/gov")}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Government Portal
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.nav.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
