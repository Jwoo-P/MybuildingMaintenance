"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authenticate } from "@/lib/store";
import { setSession } from "@/lib/session";
import { ADMIN_ROOM, ROOM_NUMBERS } from "@/lib/types";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminHint = searchParams.get("admin") === "1";

  const [selectedRoom, setSelectedRoom] = useState<string | null>(
    adminHint ? ADMIN_ROOM : null,
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminHint) setSelectedRoom(ADMIN_ROOM);
  }, [adminHint]);

  function handleLogin() {
    if (!selectedRoom) {
      setError("호수를 선택해 주세요.");
      return;
    }
    if (password.length !== 4) {
      setError("비밀번호 4자리를 입력해 주세요.");
      return;
    }
    const session = authenticate(selectedRoom, password);
    if (!session) {
      setError("비밀번호가 올바르지 않습니다. (데모: 1234)");
      return;
    }
    setSession(session);
    if (session.is_admin) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <AppShell title="로그인 · 세대 선택">
      <FlowStepper
        role={selectedRoom === ADMIN_ROOM ? "admin" : "resident"}
        currentStepId="login"
      />

      <Card>
        <CardHeader>
          <CardTitle>본인 호수를 선택하세요</CardTitle>
          <p className="text-sm text-slate-500">3×3 그리드 · 터치 44px+</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {ROOM_NUMBERS.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => {
                  setSelectedRoom(room);
                  setError("");
                }}
                className={cn(
                  "touch-target flex h-16 items-center justify-center rounded-2xl border-2 text-xl font-bold transition-all",
                  selectedRoom === room
                    ? "border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-300"
                    : "border-slate-200 bg-white hover:border-teal-300",
                  room === ADMIN_ROOM && "ring-1 ring-violet-200",
                )}
              >
                {room}
                {room === ADMIN_ROOM && (
                  <span className="sr-only">관리자</span>
                )}
              </button>
            ))}
          </div>
          {selectedRoom === ADMIN_ROOM && (
            <p className="mt-2 text-center text-xs text-violet-700">
              401호는 관리자 계정입니다
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4자리 비밀번호</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            className="text-center text-2xl tracking-[0.5em]"
          />
          <p className="text-center text-xs text-slate-500">
            데모 비밀번호: <strong>1234</strong> (모든 세대 동일)
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" onClick={handleLogin}>
            대시보드로 이동
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
