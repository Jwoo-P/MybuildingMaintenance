"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/session";
import { changeHouseholdPassword } from "@/lib/store";

function normalizePin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [roomNo, setRoomNo] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.is_admin) {
      router.replace("/dashboard");
      return;
    }
    setRoomNo(session.room_no);
  }, [router]);

  function handleSubmit() {
    setError("");
    if (!roomNo) return;
    if (current.length !== 4) {
      setError("기존 비밀번호 4자리를 입력해 주세요.");
      return;
    }
    if (next.length !== 4) {
      setError("변경 비밀번호 4자리를 입력해 주세요.");
      return;
    }
    if (confirm !== next) {
      setError("비밀번호 확인이 변경 비밀번호와 일치하지 않습니다.");
      return;
    }
    const result = changeHouseholdPassword(roomNo, current, next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push("/dashboard");
  }

  if (!roomNo) {
    return (
      <div className="flex min-h-dvh items-center justify-center">로딩 중...</div>
    );
  }

  return (
    <AppShell title={`${roomNo}호 비밀번호 변경`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-teal-600" />
            비밀번호 변경
          </CardTitle>
          <p className="text-sm text-slate-500">
            4자리 숫자 비밀번호만 사용할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              기존 비밀번호
            </label>
            <Input
              id="current-password"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={current}
              onChange={(e) => {
                setCurrent(normalizePin(e.target.value));
                setError("");
              }}
              className="text-center text-xl tracking-[0.5em]"
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              변경 비밀번호
            </label>
            <Input
              id="new-password"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={next}
              onChange={(e) => {
                setNext(normalizePin(e.target.value));
                setError("");
              }}
              className="text-center text-xl tracking-[0.5em]"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              비밀번호 확인
            </label>
            <Input
              id="confirm-password"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirm}
              onChange={(e) => {
                setConfirm(normalizePin(e.target.value));
                setError("");
              }}
              className="text-center text-xl tracking-[0.5em]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            비밀번호 변경
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/dashboard">취소 · 대시보드로</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
