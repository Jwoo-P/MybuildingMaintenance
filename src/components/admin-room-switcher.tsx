"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ensureAdminViewRoom,
  getSession,
  setAdminViewRoom,
} from "@/lib/session";
import { ADMIN_ROOM, ROOM_NUMBERS } from "@/lib/types";

export function AdminRoomSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [viewRoom, setViewRoom] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session?.is_admin) return;
    setViewRoom(ensureAdminViewRoom(ADMIN_ROOM));
  }, [pathname, open]);

  const session = typeof window !== "undefined" ? getSession() : null;
  if (!session?.is_admin) return null;

  function handleSelect(room: string) {
    setAdminViewRoom(room);
    setViewRoom(room);
    setOpen(false);
    router.push("/dashboard");
  }

  return (
    <>
      <div className="mt-6 border-t border-violet-200 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full border-violet-400 text-violet-900 hover:bg-violet-50"
          onClick={() => setOpen(true)}
        >
          <Users className="h-4 w-4" />
          관리자 세대 변경
          {viewRoom && (
            <span className="ml-1 text-xs font-normal text-slate-500">
              (현재 {viewRoom}호)
            </span>
          )}
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-room-switch-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="admin-room-switch-title"
              className="text-lg font-bold text-slate-900"
            >
              보기 세대 선택
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              선택한 세대의 세대원 화면으로 이동합니다.
            </p>
            <label htmlFor="admin-view-room" className="sr-only">
              세대 선택
            </label>
            <select
              id="admin-view-room"
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
              value={viewRoom ?? ADMIN_ROOM}
              onChange={(e) => handleSelect(e.target.value)}
            >
              {ROOM_NUMBERS.map((room) => (
                <option key={room} value={room}>
                  {room}호{room === ADMIN_ROOM ? " (관리자)" : ""}
                </option>
              ))}
            </select>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                닫기
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => viewRoom && handleSelect(viewRoom)}
              >
                세대원 화면으로
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
