"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Crown,
  Smartphone,
  Database,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resetDemoData } from "@/lib/store";
import { ADMIN_ROOM } from "@/lib/types";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleReset() {
    resetDemoData();
    alert("데모 데이터가 초기화되었습니다.");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-gradient-to-b from-teal-50 to-slate-50">
      <header className="px-4 pb-2 pt-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          건물 관리비 체크
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          PRD 전체 플로우를 화면으로 체험하는 프론트 데모
        </p>
        <Badge variant="admin" className="mt-2">
          Mock DB · localStorage
        </Badge>
      </header>

      <main className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5 text-teal-600" />
              세대원 플로우
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FlowDiagram
              steps={[
                "호수 3×3 선택",
                "비밀번호 1234",
                "지출·계좌·날짜",
                "입금 알림 2단계",
              ]}
            />
            <Button className="w-full" size="lg" asChild>
              <Link href="/login">
                세대원으로 시작
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-violet-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-violet-600" />
              관리자 플로우
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FlowDiagram
              steps={[
                `${ADMIN_ROOM}호 로그인`,
                "9세대 현황 카드",
                "지출 등록",
                "입금완료·독촉",
              ]}
              accent="violet"
            />
            <p className="text-xs text-slate-600">
              관리자: <strong>{ADMIN_ROOM}</strong>호 / 비밀번호{" "}
              <strong>1234</strong>
            </p>
            <Button
              variant="outline"
              className="w-full border-violet-400 text-violet-800 hover:bg-violet-100"
              size="lg"
              asChild
            >
              <Link href="/login?admin=1">관리자로 시작</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">입금 알림 2단계 (핵심)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-sm">
              <StepBox icon={<Database />} label="1. Mock DB 저장" sub="확인대기" />
              <span className="text-slate-400">↓</span>
              <StepBox icon={<MessageSquare />} label="2. alert → sms:" sub="문자 앱" />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              문자를 취소해도 DB는 확인대기 — 관리자가 입금완료로 최종 확정
            </p>
          </CardContent>
        </Card>

        {mounted && (
          <Button variant="secondary" className="w-full" onClick={handleReset}>
            데모 데이터 초기화
          </Button>
        )}
      </main>
    </div>
  );
}

function FlowDiagram({
  steps,
  accent = "teal",
}: {
  steps: string[];
  accent?: "teal" | "violet";
}) {
  const bg = accent === "violet" ? "bg-violet-100" : "bg-teal-100";
  const text = accent === "violet" ? "text-violet-800" : "text-teal-800";
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {steps.map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          <span className={cnBadge(bg, text)}>{step}</span>
          {i < steps.length - 1 && (
            <ArrowRight className="h-3 w-3 text-slate-400" />
          )}
        </span>
      ))}
    </div>
  );
}

function cnBadge(bg: string, text: string) {
  return `rounded-lg px-2 py-1 font-medium ${bg} ${text}`;
}

function StepBox({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-teal-600">{icon}</div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}
