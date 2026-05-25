"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings, AlertCircle, CheckCircle2, Contact } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";
import { YearlyOverviewLink } from "@/components/yearly-overview-link";
import { MonthSelector } from "@/components/month-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import {
  getAllPaymentsForMonth,
  getHouseholdPhone,
  getRoomPaymentState,
  setRoomPaymentState,
} from "@/lib/store";
import { ROOM_NUMBERS, type Payment, type RoomPaymentState } from "@/lib/types";
import { PaymentStatusSelect } from "@/components/payment-status-select";
import {
  formatMonthYearLabel,
  getCurrentMonth,
  getSelectableMonthKeys,
} from "@/lib/utils";
import { buildAdminRemindMessage, openSmsIfPhone } from "@/lib/sms";

type RoomStatus = "done" | "pending" | "none";

function getRoomStatus(
  room: string,
  payments: Payment[],
): { status: RoomStatus; payment?: Payment } {
  const p = payments.find((x) => x.room_no === room);
  if (!p) return { status: "none" };
  if (p.status === "입금완료") return { status: "done", payment: p };
  return { status: "pending", payment: p };
}

function resolveMonthFromQuery(queryMonth: string | null): string {
  const current = getCurrentMonth();
  if (!queryMonth) return current;
  const allowed = getSelectableMonthKeys();
  return allowed.includes(queryMonth) ? queryMonth : current;
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    resolveMonthFromQuery(searchParams.get("month")),
  );

  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    router.replace(`/admin?month=${month}`, { scroll: false });
  }

  const refresh = useCallback(() => {
    setPayments(getAllPaymentsForMonth(selectedMonth));
  }, [selectedMonth]);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!session.is_admin) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    refresh();
  }, [ready, refresh]);

  function changeStatus(room: string, state: RoomPaymentState) {
    setRoomPaymentState(room, selectedMonth, state);
    refresh();
  }

  function remind(room: string) {
    const body = buildAdminRemindMessage(room);
    openSmsIfPhone(
      getHouseholdPhone(room),
      body,
      `${room}호 휴대폰 번호가 없습니다. 세입자 정보 관리에서 등록해 주세요.`,
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">로딩 중...</div>
    );
  }

  const doneCount = ROOM_NUMBERS.filter(
    (r) => getRoomStatus(r, payments).status === "done",
  ).length;

  const isCurrentMonth = selectedMonth === getCurrentMonth();

  return (
    <AppShell
      title={`관리자 · ${formatMonthYearLabel(selectedMonth)} 총괄`}
      showAdminLink
    >
      <FlowStepper role="admin" currentStepId="overview" />

      <YearlyOverviewLink />

      <Button variant="outline" className="w-full border-violet-300" asChild>
        <Link href="/admin/contacts">
          <Contact className="h-4 w-4" />
          세입자 정보 관리
        </Link>
      </Button>

      <MonthSelector value={selectedMonth} onChange={handleMonthChange} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          입금완료 {doneCount}/9
          {!isCurrentMonth && (
            <span className="ml-1 text-amber-700">· 과거 월 조회 중</span>
          )}
        </p>
        {isCurrentMonth && (
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/expenses">
              <Settings className="h-4 w-4" />
              지출 등록
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ROOM_NUMBERS.map((room) => {
          const { status, payment } = getRoomStatus(room, payments);
          const paymentState = getRoomPaymentState(room, selectedMonth);
          return (
            <Card
              key={room}
              className={
                status === "done"
                  ? "border-green-300 bg-green-50/80"
                  : status === "pending"
                    ? "border-amber-300 bg-amber-50/50"
                    : "border-red-200 bg-red-50/30"
              }
            >
              <CardHeader className="p-3 pb-1">
                <Link
                  href={`/admin/households/${room}?month=${selectedMonth}`}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    {room}
                    {status === "done" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                  </CardTitle>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                <p className="text-xs text-slate-600">
                  {status === "done" && "🟢 입금완료"}
                  {status === "pending" && "🟡 확인대기"}
                  {status === "none" && "🔴 미입금"}
                </p>
                {payment && (
                  <p className="text-[10px] text-slate-500">{payment.paid_date}</p>
                )}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`status-${room}`}
                    className="text-[10px] font-medium text-slate-500"
                  >
                    입금 상태
                  </label>
                  <PaymentStatusSelect
                    id={`status-${room}`}
                    value={paymentState}
                    onChange={(state) => changeStatus(room, state)}
                  />
                  {paymentState !== "입금완료" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-10 w-full text-xs"
                      onClick={() => remind(room)}
                    >
                      독촉
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-9 text-xs" asChild>
                    <Link
                      href={`/admin/households/${room}?month=${selectedMonth}`}
                    >
                      상세
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">로딩 중...</div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
