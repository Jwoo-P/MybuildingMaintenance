"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getAdminRoom, resetHouseholdPassword } from "@/lib/store";
import { DEFAULT_PASSWORD, ROOM_NUMBERS } from "@/lib/types";

export function AdminPasswordReset() {
  const [open, setOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>(ROOM_NUMBERS[0]);
  const [done, setDone] = useState(false);

  const session = typeof window !== "undefined" ? getSession() : null;
  const adminRoom = typeof window !== "undefined" ? getAdminRoom() : null;
  if (!session?.is_admin) return null;

  function handleReset() {
    resetHouseholdPassword(selectedRoom);
    setDone(true);
    setOpen(false);
  }

  return (
    <>
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full border-amber-400 text-amber-900 hover:bg-amber-50"
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
        >
          <KeyRound className="h-4 w-4" />
          비밀번호 초기화
        </Button>
        {done && (
          <p className="mt-2 text-center text-xs text-green-700">
            비밀번호가 {DEFAULT_PASSWORD}로 초기화되었습니다.
          </p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-password-reset-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="admin-password-reset-title"
              className="text-lg font-bold text-slate-900"
            >
              비밀번호 초기화
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              선택한 호수의 비밀번호를 {DEFAULT_PASSWORD}로 되돌립니다.
            </p>
            <label
              htmlFor="reset-room"
              className="mt-4 block text-xs font-medium text-slate-600"
            >
              호수 선택
            </label>
            <select
              id="reset-room"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              {ROOM_NUMBERS.map((room) => (
                <option key={room} value={room}>
                  {room}호{room === adminRoom ? " (관리자)" : ""}
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
                variant="destructive"
                className="flex-1"
                onClick={handleReset}
              >
                초기화
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
