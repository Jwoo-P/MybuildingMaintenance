"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/payment-status";
import { getSession } from "@/lib/session";
import {
  getPaymentsByRoom,
  setPaymentStatus,
} from "@/lib/store";
import { BANK_INFO, type Payment } from "@/lib/types";
import { formatMonthLabel, formatMonthYearLabel, getCurrentMonth } from "@/lib/utils";
import { buildAdminRemindMessage, openSms } from "@/lib/sms";

function HouseholdDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomNo = params.room_no as string;
  const router = useRouter();
  const focusMonth = searchParams.get("month");
  const month = getCurrentMonth();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const session = getSession();
    if (!session?.is_admin) {
      router.replace("/login");
      return;
    }
    setPayments(getPaymentsByRoom(roomNo));
  }, [router, roomNo]);

  function refresh() {
    setPayments(getPaymentsByRoom(roomNo));
  }

  function markComplete(paymentMonth: string) {
    setPaymentStatus(roomNo, paymentMonth, "입금완료");
    refresh();
  }

  function sendSms() {
    openSms(BANK_INFO.adminPhone, buildAdminRemindMessage(roomNo));
  }

  return (
    <AppShell title={`${roomNo}호 · 납부 이력`} showAdminLink>
      <FlowStepper role="admin" currentStepId="detail" />

      <div className="flex gap-2">
        <Button variant="destructive" className="flex-1" onClick={sendSms}>
          문자 보내기 / 독촉
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() =>
            router.push(focusMonth ? `/admin?month=${focusMonth}` : "/admin")
          }
        >
          총괄로
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">과거 입금 현황</CardTitle>
          <p className="text-xs text-slate-500">payment_month 최신순</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {payments.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "rounded-xl border border-slate-200 p-3",
                  focusMonth === p.payment_month &&
                    "ring-2 ring-teal-500 bg-teal-50/50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      {formatMonthLabel(p.payment_month)}
                    </p>
                    <p className="text-sm text-slate-500">
                      이체일 {p.paid_date}
                    </p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
                {p.status === "확인대기" && (
                  <Button
                    className="mt-2 w-full"
                    size="sm"
                    onClick={() => markComplete(p.payment_month)}
                  >
                    입금완료로 변경
                  </Button>
                )}
              </li>
            ))}
            {payments.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                납부 기록이 없습니다.
              </p>
            )}
          </ul>
        </CardContent>
      </Card>

      {focusMonth && (
        <p className="text-xs text-teal-700">
          총괄에서 선택한 {formatMonthYearLabel(focusMonth)} 항목을 강조했습니다.
        </p>
      )}
      <p className="text-xs text-slate-500">
        당월({month}) 기록이 확인대기라면 위 버튼으로 최종 입금완료 처리하세요.
      </p>
    </AppShell>
  );
}

export default function HouseholdDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">로딩 중...</div>}>
      <HouseholdDetailContent />
    </Suspense>
  );
}
