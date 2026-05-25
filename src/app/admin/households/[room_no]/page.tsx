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
import { PaymentStatusSelect } from "@/components/payment-status-select";
import {
  getHouseholdPhone,
  getPaymentsByRoom,
  setRoomPaymentState,
} from "@/lib/db";
import { resolveRoomPaymentState } from "@/lib/data-helpers";
import { type Payment, type RoomPaymentState } from "@/lib/types";
import { formatMonthLabel, formatMonthYearLabel, getCurrentMonth } from "@/lib/utils";
import { buildAdminRemindMessage, openSmsIfPhone } from "@/lib/sms";

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
    void getPaymentsByRoom(roomNo).then(setPayments);
  }, [router, roomNo]);

  async function refresh() {
    setPayments(await getPaymentsByRoom(roomNo));
  }

  async function changeStatus(paymentMonth: string, state: RoomPaymentState) {
    await setRoomPaymentState(roomNo, paymentMonth, state);
    await refresh();
  }

  async function sendSms() {
    const phone = await getHouseholdPhone(roomNo);
    openSmsIfPhone(
      phone,
      buildAdminRemindMessage(roomNo),
      `${roomNo}호 휴대폰 번호가 없습니다. 세입자 정보 관리에서 등록해 주세요.`,
    );
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

      {focusMonth && (
        <Card className="border-teal-200 bg-teal-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {formatMonthYearLabel(focusMonth)} 입금 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <PaymentStatusSelect
              value={resolveRoomPaymentState(payments, roomNo, focusMonth)}
              onChange={(state) => void changeStatus(focusMonth, state)}
            />
            <p className="text-xs text-slate-600">
              미입금·확인대기·입금완료를 자유롭게 변경할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}

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
                  <PaymentStatusBadge
                    status={resolveRoomPaymentState(
                      payments,
                      roomNo,
                      p.payment_month,
                    )}
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <label
                    htmlFor={`status-${p.id}`}
                    className="text-xs font-medium text-slate-500"
                  >
                    상태 변경
                  </label>
                  <PaymentStatusSelect
                    id={`status-${p.id}`}
                    value={resolveRoomPaymentState(
                      payments,
                      roomNo,
                      p.payment_month,
                    )}
                    onChange={(state) =>
                      void changeStatus(p.payment_month, state)
                    }
                  />
                </div>
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
        당월({month}) 포함 모든 월의 입금 상태를 위에서 변경할 수 있습니다.
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
