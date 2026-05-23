"use client";

import {
  ADMIN_ROOM,
  type Expense,
  type Household,
  type Payment,
  ROOM_NUMBERS,
  type Session,
} from "./types";
import { getCurrentMonth, getCurrentYear, getElapsedMonthKeys } from "./utils";

const STORAGE_KEY = "building-maintenance-mock-v2";

interface AppData {
  households: Household[];
  payments: Payment[];
  expenses: Expense[];
  nextPaymentId: number;
  nextExpenseId: number;
}

function seedData(): AppData {
  const month = getCurrentMonth();
  const prev = month.replace(/-(\d+)$/, (_, m) => {
    const n = Number(m) - 1;
    if (n < 1) return `${month.split("-")[0]}-12`;
    return `${month.split("-")[0]}-${String(n).padStart(2, "0")}`;
  });

  const households: Household[] = ROOM_NUMBERS.map((room_no, i) => ({
    id: `hh-${i}`,
    room_no,
    password: "1234",
    is_admin: room_no === ADMIN_ROOM,
  }));

  const payments: Payment[] = buildYearSeedPayments();
  const currentMonthPayment = payments.find(
    (p) => p.room_no === "201" && p.payment_month === month,
  );
  if (!currentMonthPayment) {
    payments.push({
      id: payments.length + 1,
      room_no: "201",
      payment_month: month,
      paid_date: `${month}-03`,
      status: "확인대기",
    });
  }
  if (!payments.some((p) => p.room_no === "101" && p.payment_month === month)) {
    payments.push({
      id: payments.length + 1,
      room_no: "101",
      payment_month: month,
      paid_date: `${month}-05`,
      status: "입금완료",
    });
  }
  if (!payments.some((p) => p.room_no === "B01" && p.payment_month === prev)) {
    payments.push({
      id: payments.length + 1,
      room_no: "B01",
      payment_month: prev,
      paid_date: `${prev}-10`,
      status: "입금완료",
    });
  }

  const expenses: Expense[] = [
    {
      id: 1,
      expense_month: month,
      category: "공용전기세",
      amount: 45_000,
      memo: "1층 복도·계단",
    },
    {
      id: 2,
      expense_month: month,
      category: "계단 청소",
      amount: 30_000,
    },
    {
      id: 3,
      expense_month: month,
      category: "계단 전등",
      amount: 8_000,
    },
    {
      id: 4,
      expense_month: month,
      category: "정화조 비용",
      amount: 120_000,
      memo: "분기 정기 점검",
    },
  ];

  const nextPaymentId =
    payments.reduce((max, p) => Math.max(max, p.id), 0) + 1;

  return {
    households,
    payments,
    expenses,
    nextPaymentId,
    nextExpenseId: 5,
  };
}

function buildYearSeedPayments(): Payment[] {
  const year = getCurrentYear();
  const months = getElapsedMonthKeys(year);
  const payments: Payment[] = [];
  let id = 1;

  for (const room_no of ROOM_NUMBERS) {
    const roomIdx = ROOM_NUMBERS.indexOf(room_no);
    for (let mi = 0; mi < months.length; mi++) {
      const payment_month = months[mi];
      const seed = roomIdx * 17 + mi * 31;
      if (seed % 7 === 0) continue;

      const status =
        payment_month === getCurrentMonth() && room_no === "201"
          ? "확인대기"
          : seed % 5 === 0
            ? "확인대기"
            : "입금완료";

      payments.push({
        id: id++,
        room_no,
        payment_month,
        paid_date: `${payment_month}-${String((seed % 25) + 1).padStart(2, "0")}`,
        status,
      });
    }
  }

  return payments;
}

function load(): AppData {
  if (typeof window === "undefined") return seedData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  return JSON.parse(raw) as AppData;
}

function save(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getData(): AppData {
  return load();
}

export function resetDemoData(): void {
  const data = seedData();
  save(data);
}

export function authenticate(
  room_no: string,
  password: string,
): Session | null {
  const data = load();
  const hh = data.households.find(
    (h) => h.room_no === room_no && h.password === password,
  );
  if (!hh) return null;
  return { room_no: hh.room_no, is_admin: hh.is_admin };
}

export function getPaymentsByRoom(room_no: string): Payment[] {
  return load()
    .payments.filter((p) => p.room_no === room_no)
    .sort((a, b) => b.payment_month.localeCompare(a.payment_month));
}

export function getPaymentForMonth(
  room_no: string,
  payment_month: string,
): Payment | undefined {
  return load().payments.find(
    (p) => p.room_no === room_no && p.payment_month === payment_month,
  );
}

export function getAllPaymentsForMonth(payment_month: string): Payment[] {
  return load().payments.filter((p) => p.payment_month === payment_month);
}

export function getPaymentsForYear(year: number): Payment[] {
  const prefix = `${year}-`;
  return load().payments.filter((p) => p.payment_month.startsWith(prefix));
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

export function insertPayment(
  room_no: string,
  payment_month: string,
  paid_date: string,
): Payment {
  const data = load();
  const existing = data.payments.find(
    (p) => p.room_no === room_no && p.payment_month === payment_month,
  );
  if (existing) {
    existing.paid_date = paid_date;
    existing.status = "확인대기";
    save(data);
    return existing;
  }
  const payment: Payment = {
    id: data.nextPaymentId++,
    room_no,
    payment_month,
    paid_date,
    status: "확인대기",
  };
  data.payments.push(payment);
  save(data);
  return payment;
}

export function setPaymentStatus(
  room_no: string,
  payment_month: string,
  status: Payment["status"],
): void {
  const data = load();
  let payment = data.payments.find(
    (p) => p.room_no === room_no && p.payment_month === payment_month,
  );
  if (!payment) {
    payment = {
      id: data.nextPaymentId++,
      room_no,
      payment_month,
      paid_date: new Date().toISOString().slice(0, 10),
      status,
    };
    data.payments.push(payment);
  } else {
    payment.status = status;
  }
  save(data);
}

export function getExpensesForMonth(expense_month: string): Expense[] {
  return load().expenses.filter((e) => e.expense_month === expense_month);
}

export function upsertExpensesForMonth(
  expense_month: string,
  items: Omit<Expense, "id" | "expense_month">[],
): void {
  const data = load();
  data.expenses = data.expenses.filter((e) => e.expense_month !== expense_month);
  for (const item of items) {
    data.expenses.push({
      id: data.nextExpenseId++,
      expense_month,
      ...item,
    });
  }
  save(data);
}
