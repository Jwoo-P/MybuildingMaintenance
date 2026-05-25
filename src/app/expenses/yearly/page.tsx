"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { YearlyExpensesMatrix } from "@/components/yearly-expenses-matrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { getCurrentYear } from "@/lib/utils";

const MIN_YEAR = 2024;

export default function YearlyExpensesPage() {
  const router = useRouter();
  const [year, setYear] = useState(getCurrentYear());
  const [backHref, setBackHref] = useState("/dashboard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setBackHref(session.is_admin ? "/admin" : "/dashboard");
    setReady(true);
  }, [router]);

  const currentYear = getCurrentYear();
  const canGoNext = year < currentYear;
  const canGoPrev = year > MIN_YEAR;

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">로딩 중...</div>
    );
  }

  return (
    <AppShell title={`${year}년 지출 내역 현황`} showAdminLink>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="icon"
          disabled={!canGoPrev}
          onClick={() => setYear((y) => y - 1)}
          aria-label="이전 연도"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="text-center text-lg font-bold">{year}년</p>
        <Button
          variant="secondary"
          size="icon"
          disabled={!canGoNext}
          onClick={() => setYear((y) => y + 1)}
          aria-label="다음 연도"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 text-xs text-slate-600">
          {year === currentYear
            ? "올해는 1월부터 이번 달까지만 표시합니다. 아직 오지 않은 달은 보이지 않습니다."
            : "과거 연도는 1월~12월 전체를 표시합니다."}
          <span className="mt-1 block">
            항목: 공용전기세 · 계단청소 · 정화조 · 기타
          </span>
        </CardContent>
      </Card>

      <YearlyExpensesMatrix year={year} />

      <Button variant="secondary" className="w-full" onClick={() => router.push(backHref)}>
        돌아가기
      </Button>
    </AppShell>
  );
}
