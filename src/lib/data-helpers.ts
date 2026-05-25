import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type Payment,
  type RoomPaymentState,
} from "./types";

export const EXPENSE_CATEGORY_ALIASES: Record<string, ExpenseCategory> = {
  "계단 청소": "계단청소",
  "정화조 비용": "정화조",
  "계단 전등": "기타",
};

export function normalizeExpenseCategory(category: string): ExpenseCategory {
  if (EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
    return category as ExpenseCategory;
  }
  return EXPENSE_CATEGORY_ALIASES[category] ?? "기타";
}

export function getPaymentForRoomMonth(
  room_no: string,
  payment_month: string,
  payments: Payment[],
): Payment | undefined {
  return payments.find(
    (p) => p.room_no === room_no && p.payment_month === payment_month,
  );
}

export function getExpenseForCategoryMonth(
  category: ExpenseCategory,
  expense_month: string,
  expenses: Expense[],
): Expense | undefined {
  return expenses.find(
    (e) =>
      e.expense_month === expense_month &&
      normalizeExpenseCategory(e.category) === category,
  );
}

export function resolveRoomPaymentState(
  payments: Payment[],
  room_no: string,
  payment_month: string,
): RoomPaymentState {
  const payment = getPaymentForRoomMonth(room_no, payment_month, payments);
  if (!payment) return "미입금";
  return payment.status;
}
