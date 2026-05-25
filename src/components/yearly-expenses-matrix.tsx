"use client";

import { useEffect, useState } from "react";
import { getExpensesForYear } from "@/lib/db";
import { getExpenseForCategoryMonth } from "@/lib/data-helpers";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/types";
import { formatCurrency, formatMonthShort, getElapsedMonthKeys } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface YearlyExpensesMatrixProps {
  year: number;
}

function formatAmountCompact(amount: number): string {
  if (amount === 0) return "0";
  if (amount >= 10_000) {
    const man = amount / 10_000;
    return Number.isInteger(man) ? `${man}만` : `${man.toFixed(1)}만`;
  }
  return `${(amount / 1000).toFixed(0)}천`;
}

export function YearlyExpensesMatrix({ year }: YearlyExpensesMatrixProps) {
  const months = getElapsedMonthKeys(year);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void getExpensesForYear(year)
      .then(setExpenses)
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
              <th className="sticky left-0 z-10 min-w-[72px] border-r border-slate-200 bg-slate-50 px-2 py-3 text-left text-xs font-bold text-slate-700">
                지출내역
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
            {EXPENSE_CATEGORIES.map((category) => (
              <tr key={category} className="border-b border-slate-100 last:border-0">
                <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-2 py-2 text-left text-xs font-bold leading-tight">
                  {category}
                </th>
                {months.map((expense_month) => {
                  const expense = getExpenseForCategoryMonth(
                    category as ExpenseCategory,
                    expense_month,
                    expenses,
                  );
                  const registered = !!expense;
                  return (
                    <td key={expense_month} className="p-1 text-center">
                      <div
                        className={cn(
                          "touch-target mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-lg px-0.5 text-[9px] font-medium leading-tight",
                          registered
                            ? "bg-green-100 text-green-900"
                            : "bg-red-50 text-red-800",
                        )}
                        title={
                          registered
                            ? `${category} ${formatMonthShort(expense_month)}: ${formatCurrency(expense!.amount)}`
                            : `${category} ${formatMonthShort(expense_month)}: 미등록`
                        }
                      >
                        {registered ? (
                          <span>{formatAmountCompact(expense!.amount)}</span>
                        ) : (
                          <span className="text-base leading-none">—</span>
                        )}
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
        <span className="text-green-800">녹색: 금액 등록됨</span>
        <span className="text-red-800">— 미등록</span>
      </div>
    </div>
  );
}
