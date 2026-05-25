"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Bell, KeyRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";
import { YearlyOverviewLink } from "@/components/yearly-overview-link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentStatusBadge } from "@/components/payment-status";
import { ensureAdminViewRoom, getSession } from "@/lib/session";
import {
  getAdminPhone,
  getExpensesForMonth,
  getPaymentsByRoom,
  insertPayment,
} from "@/lib/store";
import {
  buildResidentNotifyMessage,
  openSmsIfPhone,
} from "@/lib/sms";
import { BANK_INFO, MONTHLY_FEE, type Expense, type Payment } from "@/lib/types";
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonth,
  todayISO,
} from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [roomNo, setRoomNo] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [paidDate, setPaidDate] = useState(todayISO());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [flowStep, setFlowStep] = useState<"dashboard" | "notify">("dashboard");
  const [lastAction, setLastAction] = useState<string | null>(null);
  const month = getCurrentMonth();

  useEffect(() => {
    function loadRoom() {
      const session = getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      if (session.is_admin) {
        const viewRoom = ensureAdminViewRoom();
        setIsAdminView(true);
        setRoomNo(viewRoom);
        refresh(viewRoom);
        return;
      }
      setIsAdminView(false);
      setRoomNo(session.room_no);
      refresh(session.room_no);
    }

    loadRoom();
    window.addEventListener("admin-view-room-changed", loadRoom);
    return () =>
      window.removeEventListener("admin-view-room-changed", loadRoom);
  }, [router]);

  function refresh(rn: string) {
    setExpenses(getExpensesForMonth(month));
    setPayments(getPaymentsByRoom(rn));
  }

  async function copyAccount() {
    const text = `${BANK_INFO.bank} ${BANK_INFO.account} (${BANK_INFO.holder})`;
    await navigator.clipboard.writeText(text);
    setLastAction("계좌 정보가 복사되었습니다.");
  }

  function handleNotify() {
    if (!roomNo) return;
    setFlowStep("notify");

    insertPayment(roomNo, month, paidDate);
    refresh(roomNo);

    const body = buildResidentNotifyMessage(roomNo, month, paidDate);
    alert(
      "1단계 완료: 납부 내역이 '확인대기'로 저장되었습니다.\n\n2단계: 문자 앱으로 이동합니다.",
    );
    openSmsIfPhone(
      getAdminPhone(),
      body,
      "관리자 휴대폰 번호가 등록되어 있지 않습니다. 관리자에게 세입자 정보 관리에서 번호 등록을 요청해 주세요.",
    );
    setLastAction(`입금 알림 처리됨 · ${body}`);
    setFlowStep("dashboard");
  }

  if (!roomNo) {
    return (
      <div className="flex min-h-dvh items-center justify-center">로딩 중...</div>
    );
  }

  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <AppShell
      title={`${roomNo}호 대시보드${isAdminView ? " (관리자 보기)" : ""}`}
      showAdminLink={isAdminView}
    >
      <FlowStepper role="resident" currentStepId={flowStep} />

      <YearlyOverviewLink />

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">이번 달 공용 지출</CardTitle>
          <p className="text-sm text-slate-500">{month} · 합계 {formatCurrency(expenseTotal)}</p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="expenses">
              <AccordionTrigger>지출 내역 펼치기</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {expenses.map((e) => (
                    <li
                      key={e.id}
                      className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>
                        {e.category}
                        {e.memo && (
                          <span className="block text-xs text-slate-500">
                            {e.memo}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(e.amount)}
                      </span>
                    </li>
                  ))}
                  {expenses.length === 0 && (
                    <li className="text-sm text-slate-500">
                      등록된 지출이 없습니다.
                    </li>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle>관리비 입금 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-xl bg-teal-50 p-3 text-center font-medium text-teal-900">
            매월 관리비는 {formatCurrency(MONTHLY_FEE)}입니다.
          </p>
          <div className="rounded-xl border border-slate-200 p-3 text-sm">
            <p>{BANK_INFO.bank}</p>
            <p className="text-lg font-bold">{BANK_INFO.account}</p>
            <p className="text-slate-500">예금주 {BANK_INFO.holder}</p>
          </div>
          <Button variant="secondary" className="w-full" onClick={copyAccount}>
            <Copy className="h-4 w-4" />
            복사
          </Button>

          <div>
            <label
              htmlFor="paid-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              이체 날짜
            </label>
            <Input
              id="paid-date"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">기본값: 오늘</p>
          </div>

          <Button className="w-full" size="lg" onClick={handleNotify}>
            <Bell className="h-5 w-5" />
            입금 알림 보내기
          </Button>
          <p className="text-center text-xs text-slate-500">
            DB 저장(확인대기) → alert → sms: 문자 앱
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">입금 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowHistory((v) => !v)}
          >
            입금 기록 확인
          </Button>
          {showHistory && (
            <ul className="mt-3 space-y-2">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <p className="font-semibold">
                      {formatMonthLabel(p.payment_month)}
                    </p>
                    <p className="text-xs text-slate-500">{p.paid_date}</p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </li>
              ))}
              {payments.length === 0 && (
                <p className="text-center text-sm text-slate-500">
                  기록이 없습니다.
                </p>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {lastAction && (
        <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          {lastAction}
        </p>
      )}

      {!isAdminView && (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/password">
            <KeyRound className="h-4 w-4" />
            비밀번호 변경
          </Link>
        </Button>
      )}
    </AppShell>
  );
}
