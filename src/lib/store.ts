"use client";

import {
  ADMIN_ROOM,
  BANK_INFO,
  DEFAULT_PASSWORD,
  type Expense,
  type Household,
  type Payment,
  type RoomPaymentState,
  ROOM_NUMBERS,
  type RoomNo,
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
    phone: room_no === ADMIN_ROOM ? BANK_INFO.adminPhone : "",
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

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function migrateHouseholdPhones(data: AppData): AppData {
  let changed = false;
  for (const room_no of ROOM_NUMBERS) {
    let hh = data.households.find((h) => h.room_no === room_no);
    if (!hh) {
      const i = data.households.length;
      hh = {
        id: `hh-${i}`,
        room_no,
        password: "1234",
        is_admin: room_no === ADMIN_ROOM,
        phone: room_no === ADMIN_ROOM ? BANK_INFO.adminPhone : "",
      };
      data.households.push(hh);
      changed = true;
      continue;
    }
    if (hh.phone === undefined) {
      hh.phone =
        room_no === ADMIN_ROOM ? BANK_INFO.adminPhone : "";
      changed = true;
    }
  }
  if (changed) save(data);
  return data;
}

function load(): AppData {
  if (typeof window === "undefined") return seedData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  const data = JSON.parse(raw) as AppData;
  return migrateHouseholdPhones(data);
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

export function getHouseholds(): Household[] {
  return ROOM_NUMBERS.map(
    (room_no) =>
      load().households.find((h) => h.room_no === room_no)!,
  );
}

export function getHouseholdPhone(room_no: string): string {
  const hh = load().households.find((h) => h.room_no === room_no);
  return hh?.phone ?? "";
}

export function getAdminPhone(): string {
  const phone = getHouseholdPhone(ADMIN_ROOM);
  return phone || BANK_INFO.adminPhone;
}

export function updateHouseholdPhones(
  updates: { room_no: RoomNo; phone: string }[],
): void {
  const data = load();
  for (const { room_no, phone } of updates) {
    const hh = data.households.find((h) => h.room_no === room_no);
    if (hh) hh.phone = normalizePhone(phone);
  }
  save(data);
}

export function resetHouseholdPassword(room_no: string): void {
  const data = load();
  const hh = data.households.find((h) => h.room_no === room_no);
  if (!hh) return;
  hh.password = DEFAULT_PASSWORD;
  save(data);
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; message: string };

export function changeHouseholdPassword(
  room_no: string,
  currentPassword: string,
  newPassword: string,
): ChangePasswordResult {
  if (!/^\d{4}$/.test(newPassword)) {
    return { ok: false, message: "변경 비밀번호는 4자리 숫자여야 합니다." };
  }
  const data = load();
  const hh = data.households.find((h) => h.room_no === room_no);
  if (!hh) {
    return { ok: false, message: "세대 정보를 찾을 수 없습니다." };
  }
  if (hh.password !== currentPassword) {
    return { ok: false, message: "기존 비밀번호가 일치하지 않습니다." };
  }
  if (currentPassword === newPassword) {
    return {
      ok: false,
      message: "변경 비밀번호는 기존 비밀번호와 달라야 합니다.",
    };
  }
  hh.password = newPassword;
  save(data);
  return { ok: true };
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
  setRoomPaymentState(room_no, payment_month, status);
}

export function getRoomPaymentState(
  room_no: string,
  payment_month: string,
): RoomPaymentState {
  const payment = getPaymentForMonth(room_no, payment_month);
  if (!payment) return "미입금";
  return payment.status;
}

export function setRoomPaymentState(
  room_no: string,
  payment_month: string,
  state: RoomPaymentState,
): void {
  const data = load();
  const idx = data.payments.findIndex(
    (p) => p.room_no === room_no && p.payment_month === payment_month,
  );

  if (state === "미입금") {
    if (idx >= 0) {
      data.payments.splice(idx, 1);
      save(data);
    }
    return;
  }

  if (idx >= 0) {
    data.payments[idx].status = state;
  } else {
    data.payments.push({
      id: data.nextPaymentId++,
      room_no,
      payment_month,
      paid_date: new Date().toISOString().slice(0, 10),
      status: state,
    });
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
