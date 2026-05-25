"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FlowStepper } from "@/components/flow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/session";
import {
  getExpensesForMonth,
  normalizeExpenseCategory,
  upsertExpensesForMonth,
} from "@/lib/store";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { getCurrentMonth, formatCurrency } from "@/lib/utils";

interface ExpenseFormRow {
  category: string;
  amount: string;
  memo: string;
}

function buildEmptyRows(existing: ReturnType<typeof getExpensesForMonth>): ExpenseFormRow[] {
  return EXPENSE_CATEGORIES.map((category) => {
    const row = existing.find(
      (e) => normalizeExpenseCategory(e.category) === category,
    );
    return {
      category,
      amount: row != null ? String(row.amount) : "",
      memo: row?.memo ?? "",
    };
  });
}

export default function AdminExpensesPage() {
  const router = useRouter();
  const month = getCurrentMonth();
  const [rows, setRows] = useState<ExpenseFormRow[]>(() =>
    buildEmptyRows([]),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.is_admin) {
      router.replace("/login");
      return;
    }
    setRows(buildEmptyRows(getExpensesForMonth(month)));
  }, [router, month]);

  function updateRow(
    index: number,
    field: keyof ExpenseFormRow,
    value: string,
  ) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
    setSaved(false);
  }

  function handleSave() {
    const items = EXPENSE_CATEGORIES.map((category) => {
      const r = rows.find((row) => row.category === category)!;
      const parsed = r.amount.replace(/\D/g, "");
      return {
        category,
        amount: parsed === "" ? 0 : Number(parsed),
        memo: r.memo.trim() || undefined,
      };
    });
    upsertExpensesForMonth(month, items);
    setSaved(true);
    alert("지출 내역이 저장되었습니다. 세대원 대시보드 아코디언에 반영됩니다.");
  }

  const total = rows.reduce(
    (s, r) => s + (Number(r.amount.replace(/\D/g, "")) || 0),
    0,
  );

  return (
    <AppShell title="당월 공용 지출 등록" showAdminLink>
      <FlowStepper role="admin" currentStepId="expenses" />

      <p className="text-sm text-slate-600">
        대상 월: <strong>{month}</strong> · 예상 합계 {formatCurrency(total)}
      </p>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <Card key={`${row.category}-${index}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{row.category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-xs text-slate-500">금액 (원)</label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={row.amount}
                  onChange={(e) => updateRow(index, "amount", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">비고</label>
                <Input
                  placeholder="선택 입력"
                  value={row.memo}
                  onChange={(e) => updateRow(index, "memo", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={handleSave}>
        저장하기
      </Button>
      {saved && (
        <p className="text-center text-sm text-green-700">
          저장 완료 · /dashboard 에서 확인 가능
        </p>
      )}

      <Button variant="secondary" className="w-full" onClick={() => router.push("/admin")}>
        총괄 대시보드로
      </Button>
    </AppShell>
  );
}
