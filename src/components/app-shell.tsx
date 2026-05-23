"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  showAdminLink?: boolean;
}

export function AppShell({
  title,
  children,
  showAdminLink = false,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session =
    typeof window !== "undefined" ? getSession() : null;

  function logout() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">건물 관리비 체크</p>
            <h1 className="truncate text-lg font-bold">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {session && (
              <Badge variant={session.is_admin ? "admin" : "default"}>
                {session.room_no}
                {session.is_admin ? " 관리자" : ""}
              </Badge>
            )}
            <Button variant="ghost" size="icon" asChild aria-label="홈">
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            {pathname !== "/" && pathname !== "/login" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="로그아웃"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        {showAdminLink && session?.is_admin && (
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" asChild>
              <Link href="/admin">관리자 총괄</Link>
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" asChild>
              <Link href="/dashboard">세대원 화면</Link>
            </Button>
          </div>
        )}
      </header>
      <main className="space-y-4 p-4 pb-8">{children}</main>
    </div>
  );
}
