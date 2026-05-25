"use client";

import { useEffect, useState } from "react";
import { getPaymentsForYear } from "@/lib/db";
import { getPaymentForRoomMonth } from "@/lib/data-helpers";
import { ROOM_NUMBERS, type Payment } from "@/lib/types";
import {
  formatMonthShort,
  getElapsedMonthKeys,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

type CellStatus = "done" | "pending" | "none";

function resolveCellStatus(payment?: Payment): CellStatus {
  if (!payment) return "none";
  if (payment.status === "입금완료") return "done";
  return "pending";
}

const CELL_STYLES: Record<
  CellStatus,
  { bg: string; label: string; emoji: string }
> = {
  done: {
    bg: "bg-green-100 text-green-900",
    label: "입금완료",
    emoji: "🟢",
  },
  pending: {
    bg: "bg-amber-100 text-amber-900",
    label: "확인대기",
    emoji: "🟡",
  },
  none: {
    bg: "bg-red-50 text-red-800",
    label: "미입금",
    emoji: "🔴",
  },
};

interface YearlyPaymentsMatrixProps {
  year: number;
}

export function YearlyPaymentsMatrix({ year }: YearlyPaymentsMatrixProps) {
  const months = getElapsedMonthKeys(year);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getPaymentsForYear(year)
      .then(setPayments)
      .finally(() => setLoading(false));
  }, [year]);

  if (months.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        표시할 월이 없습니다.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        불러오는 중...
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 min-w-[56px] border-r border-slate-200 bg-slate-50 px-2 py-3 text-left text-xs font-bold text-slate-700">
                호수
              </th>
              {months.map((m) => (
                <th
                  key={m}
                  className="min-w-[44px] px-1 py-3 text-center text-xs font-semibold text-slate-600"
                >
                  {formatMonthShort(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOM_NUMBERS.map((room) => (
              <tr key={room} className="border-b border-slate-100 last:border-0">
                <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-2 py-2 text-left text-sm font-bold">
                  {room}
                </th>
                {months.map((payment_month) => {
                  const payment = getPaymentForRoomMonth(
                    room,
                    payment_month,
                    payments,
                  );
                  const cell = resolveCellStatus(payment);
                  const style = CELL_STYLES[cell];
                  return (
                    <td key={payment_month} className="p-1 text-center">
                      <div
                        className={cn(
                          "touch-target mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-lg text-[10px] font-medium leading-tight",
                          style.bg,
                        )}
                        title={`${room} ${formatMonthShort(payment_month)}: ${style.label}`}
                      >
                        <span className="text-base leading-none">{style.emoji}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
        <span>🟢 입금완료</span>
        <span>🟡 확인대기</span>
        <span>🔴 미입금</span>
      </div>
    </div>
  );
}
