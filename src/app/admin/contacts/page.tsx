"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Contact, Save } from "lucide-react";
import { AdminPasswordReset } from "@/components/admin-password-reset";
import { AdminRoomSwitcher } from "@/components/admin-room-switcher";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/session";
import {
  getAdminRoom,
  getHouseholds,
  updateHouseholdPhones,
} from "@/lib/db";
import { ROOM_NUMBERS, type RoomNo } from "@/lib/types";

type PhoneRow = { room_no: RoomNo; phone: string };

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return phone;
}

function isValidPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 11;
}

export default function AdminContactsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PhoneRow[]>([]);
  const [adminRoom, setAdminRoom] = useState("401");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session?.is_admin) {
      router.replace("/login");
      return;
    }
    void Promise.all([getHouseholds(), getAdminRoom()]).then(
      ([households, admin]) => {
        setAdminRoom(admin);
        setRows(
          households.map((h) => ({
            room_no: h.room_no as RoomNo,
            phone: h.phone,
          })),
        );
      },
    );
  }, [router]);

  function setPhone(room_no: RoomNo, phone: string) {
    setRows((prev) =>
      prev.map((r) => (r.room_no === room_no ? { ...r, phone } : r)),
    );
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    const invalid = rows.filter((r) => r.phone.trim() && !isValidPhone(r.phone));
    if (invalid.length > 0) {
      setError(
        `${invalid.map((r) => r.room_no).join(", ")}호: 휴대폰 번호는 10~11자리 숫자로 입력해 주세요.`,
      );
      return;
    }
    const empty = rows.filter((r) => !r.phone.trim());
    if (empty.length > 0) {
      setError(
        `${empty.map((r) => r.room_no).join(", ")}호: 번호를 입력해 주세요. (9세대 모두 필요)`,
      );
      return;
    }
    await updateHouseholdPhones(
      rows.map((r) => ({ room_no: r.room_no, phone: r.phone })),
    );
    setSaved(true);
    setError("");
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center">로딩 중...</div>
    );
  }

  return (
    <AppShell title="세입자 정보 관리" showAdminLink>
      <FlowStepper role="admin" currentStepId="overview" />

      <Card className="border-violet-200 bg-violet-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Contact className="h-5 w-5 text-violet-600" />
            호수 · 휴대폰 번호
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            9세대(관리자 {adminRoom}호 포함) 휴대폰 번호를 등록합니다. 세대원이
            관리자에게 입금 알림 문자를 보낼 때, 관리자가 독촉 문자를 보낼 때 이
            번호가 사용됩니다.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">총괄 화면으로</Link>
          </Button>
        </CardContent>
      </Card>

      <ul className="space-y-3">
        {ROOM_NUMBERS.map((room) => {
          const row = rows.find((r) => r.room_no === room)!;
          const isAdmin = room === adminRoom;
          return (
            <li key={room}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
                  <div className="shrink-0 sm:w-24">
                    <p className="text-xs text-slate-500">호수</p>
                    <p className="flex items-center gap-2 text-xl font-bold">
                      {room}
                      {isAdmin && (
                        <Badge variant="admin" className="text-[10px]">
                          관리자
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`phone-${room}`}
                      className="mb-1 block text-xs font-medium text-slate-600"
                    >
                      휴대폰 번호
                    </label>
                    <Input
                      id={`phone-${room}`}
                      type="tel"
                      inputMode="numeric"
                      placeholder="01012345678"
                      value={row.phone}
                      onChange={(e) => setPhone(room, e.target.value)}
                    />
                    {row.phone && isValidPhone(row.phone) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatPhoneDisplay(row.phone)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          저장되었습니다. 문자 보내기 시 등록된 번호가 사용됩니다.
        </p>
      )}

      <Button className="w-full" size="lg" onClick={handleSave}>
        <Save className="h-5 w-5" />
        전체 저장
      </Button>

      <AdminPasswordReset />

      <AdminRoomSwitcher />
    </AppShell>
  );
}
