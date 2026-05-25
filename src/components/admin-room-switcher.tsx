"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession, setSession } from "@/lib/session";
import { getAdminRoom, transferAdminRole } from "@/lib/db";
import { ROOM_NUMBERS } from "@/lib/types";

export function AdminRoomSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adminRoom, setAdminRoom] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refreshAdminRoom() {
    const room = await getAdminRoom();
    setAdminRoom(room);
    setSelectedRoom(room);
  }

  useEffect(() => {
    const session = getSession();
    if (!session?.is_admin) return;
    void refreshAdminRoom();
  }, [open]);

  const session = typeof window !== "undefined" ? getSession() : null;
  if (!session?.is_admin) return null;

  async function handleTransfer() {
    setError("");
    const result = await transferAdminRole(selectedRoom);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSession({ room_no: session!.room_no, is_admin: false });
    setSuccess(
      `관리자가 ${result.previousAdmin}호에서 ${result.newAdmin}호로 변경되었습니다. ${result.previousAdmin}호는 세대원 계정입니다.`,
    );
    setOpen(false);
    await refreshAdminRoom();
    router.replace("/dashboard");
  }

  return (
    <>
      <div className="mt-6 border-t border-violet-200 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full border-violet-400 text-violet-900 hover:bg-violet-50"
          onClick={() => {
            setError("");
            setSuccess("");
            void refreshAdminRoom();
            setOpen(true);
          }}
        >
          <Users className="h-4 w-4" />
          관리자 세대 변경
          {adminRoom && (
            <span className="ml-1 text-xs font-normal text-slate-500">
              (현재 관리자 {adminRoom}호)
            </span>
          )}
        </Button>
        {success && (
          <p className="mt-2 text-center text-xs text-green-700">{success}</p>
        )}
      </div>

      {open && adminRoom && (
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
              관리자 권한 이전
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              현재 관리자는 <strong>{adminRoom}호</strong>입니다. 새 관리자 호수를
              선택한 뒤 변경하면, 기존 관리자는 세대원이 되고 선택한 호수가
              관리자가 됩니다. 비밀번호·연락처·입금 데이터는 그대로 유지됩니다.
            </p>
            <label
              htmlFor="new-admin-room"
              className="mt-4 block text-xs font-medium text-slate-600"
            >
              새 관리자 호수
            </label>
            <select
              id="new-admin-room"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setError("");
              }}
            >
              {ROOM_NUMBERS.map((room) => (
                <option key={room} value={room}>
                  {room}호{room === adminRoom ? " (현재 관리자)" : ""}
                </option>
              ))}
            </select>

            {error && (
              <p className="mt-2 text-sm text-red-700">{error}</p>
            )}

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
                disabled={selectedRoom === adminRoom}
                onClick={handleTransfer}
              >
                관리자 세대 변경
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
