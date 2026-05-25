"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  ADMIN_ROOM,
  BANK_INFO,
  DEFAULT_PASSWORD,
  type Expense,
  type Household,
  type Payment,
  type PaymentStatus,
  ROOM_NUMBERS,
  type RoomNo,
  type RoomPaymentState,
  type Session,
} from "@/lib/types";
import {
  getCurrentMonth,
  getCurrentYear,
  getElapsedMonthKeys,
} from "@/lib/utils";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

type HouseholdRow = {
  id: string;
  room_no: string;
  password: string;
  is_admin: boolean;
  phone: string;
};

type PaymentRow = {
  id: number;
  room_no: string;
  payment_month: string;
  paid_date: string;
  status: PaymentStatus;
};

type ExpenseRow = {
  id: number;
  expense_month: string;
  category: string;
  amount: number;
  memo: string | null;
};

function mapHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    room_no: row.room_no,
    password: row.password,
    is_admin: row.is_admin,
    phone: row.phone ?? "",
  };
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    room_no: row.room_no,
    payment_month: row.payment_month,
    paid_date: row.paid_date.slice(0, 10),
    status: row.status,
  };
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    expense_month: row.expense_month,
    category: row.category,
    amount: row.amount,
    memo: row.memo ?? undefined,
  };
}

function buildYearSeedPayments(): Omit<Payment, "id">[] {
  const year = getCurrentYear();
  const months = getElapsedMonthKeys(year);
  const payments: Omit<Payment, "id">[] = [];

  for (const room_no of ROOM_NUMBERS) {
    const roomIdx = ROOM_NUMBERS.indexOf(room_no);
    for (let mi = 0; mi < months.length; mi++) {
      const payment_month = months[mi];
      const seed = roomIdx * 17 + mi * 31;
      if (seed % 7 === 0) continue;

      const status: PaymentStatus =
        payment_month === getCurrentMonth() && room_no === "201"
          ? "확인대기"
          : seed % 5 === 0
            ? "확인대기"
            : "입금완료";

      payments.push({
        room_no,
        payment_month,
        paid_date: `${payment_month}-${String((seed % 25) + 1).padStart(2, "0")}`,
        status,
      });
    }
  }

  return payments;
}

function buildDemoPayments(): Omit<Payment, "id">[] {
  const month = getCurrentMonth();
  const prev = month.replace(/-(\d+)$/, (_, m) => {
    const n = Number(m) - 1;
    if (n < 1) return `${month.split("-")[0]}-12`;
    return `${month.split("-")[0]}-${String(n).padStart(2, "0")}`;
  });

  const payments = buildYearSeedPayments();

  const ensure = (
    room_no: string,
    payment_month: string,
    paid_date: string,
    status: PaymentStatus,
  ) => {
    const idx = payments.findIndex(
      (p) => p.room_no === room_no && p.payment_month === payment_month,
    );
    const row = { room_no, payment_month, paid_date, status };
    if (idx >= 0) payments[idx] = row;
    else payments.push(row);
  };

  ensure("201", month, `${month}-03`, "확인대기");
  ensure("101", month, `${month}-05`, "입금완료");
  ensure("B01", prev, `${prev}-10`, "입금완료");

  return payments;
}

function buildDemoExpenses(): Omit<Expense, "id">[] {
  const month = getCurrentMonth();
  return [
    {
      expense_month: month,
      category: "공용전기세",
      amount: 45_000,
      memo: "1층 복도·계단",
    },
    {
      expense_month: month,
      category: "계단청소",
      amount: 30_000,
    },
    {
      expense_month: month,
      category: "기타",
      amount: 8_000,
      memo: "계단 전등",
    },
    {
      expense_month: month,
      category: "정화조",
      amount: 120_000,
      memo: "분기 정기 점검",
    },
  ];
}

export type AuthenticateResult =
  | { ok: true; session: Session }
  | { ok: false; reason: "invalid" | "unavailable" };

export async function authenticate(
  room_no: string,
  password: string,
): Promise<AuthenticateResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .select("room_no, is_admin")
      .eq("room_no", room_no)
      .eq("password", password)
      .maybeSingle();

    if (error) {
      console.error("authenticate:", error.message);
      return { ok: false, reason: "unavailable" };
    }
    if (!data) return { ok: false, reason: "invalid" };
    return {
      ok: true,
      session: { room_no: data.room_no, is_admin: data.is_admin },
    };
  } catch (e) {
    console.error("authenticate:", e);
    return { ok: false, reason: "unavailable" };
  }
}

export async function getAdminRoom(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .select("room_no")
      .eq("is_admin", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("getAdminRoom:", error.message);
      return ADMIN_ROOM;
    }
    return data?.room_no ?? ADMIN_ROOM;
  } catch (e) {
    console.error("getAdminRoom:", e);
    return ADMIN_ROOM;
  }
}

export async function getHouseholds(): Promise<Household[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .order("room_no");

  if (error) throw error;
  const byRoom = new Map((data ?? []).map((r) => [r.room_no, mapHousehold(r)]));
  return ROOM_NUMBERS.map(
    (room_no) => byRoom.get(room_no) ?? {
      id: "",
      room_no,
      password: DEFAULT_PASSWORD,
      is_admin: room_no === ADMIN_ROOM,
      phone: room_no === ADMIN_ROOM ? BANK_INFO.adminPhone : "",
    },
  );
}

export async function getHouseholdPhone(room_no: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("households")
    .select("phone")
    .eq("room_no", room_no)
    .maybeSingle();

  if (error) throw error;
  return data?.phone ?? "";
}

export async function getAdminPhone(): Promise<string> {
  const adminRoom = await getAdminRoom();
  const phone = await getHouseholdPhone(adminRoom);
  return phone || BANK_INFO.adminPhone;
}

export type TransferAdminResult =
  | { ok: true; previousAdmin: string; newAdmin: string }
  | { ok: false; message: string };

export async function transferAdminRole(
  newAdminRoom: string,
): Promise<TransferAdminResult> {
  if (!ROOM_NUMBERS.includes(newAdminRoom as RoomNo)) {
    return { ok: false, message: "유효하지 않은 호수입니다." };
  }

  const supabase = createAdminClient();
  const { data: admins, error: listError } = await supabase
    .from("households")
    .select("room_no")
    .eq("is_admin", true);

  if (listError) throw listError;

  const currentAdmin = admins?.[0]?.room_no ?? ADMIN_ROOM;
  if (currentAdmin === newAdminRoom) {
    return { ok: false, message: "선택한 호수가 이미 관리자입니다." };
  }

  const { error: clearError } = await supabase
    .from("households")
    .update({ is_admin: false })
    .eq("is_admin", true);

  if (clearError) throw clearError;

  const { error: setError } = await supabase
    .from("households")
    .update({ is_admin: true })
    .eq("room_no", newAdminRoom);

  if (setError) throw setError;

  return { ok: true, previousAdmin: currentAdmin, newAdmin: newAdminRoom };
}

export async function updateHouseholdPhones(
  updates: { room_no: RoomNo; phone: string }[],
): Promise<void> {
  const supabase = createAdminClient();
  for (const { room_no, phone } of updates) {
    const { error } = await supabase
      .from("households")
      .update({ phone: normalizePhone(phone) })
      .eq("room_no", room_no);
    if (error) throw error;
  }
}

export async function resetHouseholdPassword(room_no: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("households")
    .update({ password: DEFAULT_PASSWORD })
    .eq("room_no", room_no);
  if (error) throw error;
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; message: string };

export async function changeHouseholdPassword(
  room_no: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (!/^\d{4}$/.test(newPassword)) {
    return { ok: false, message: "변경 비밀번호는 4자리 숫자여야 합니다." };
  }

  const supabase = createAdminClient();
  const { data: hh, error } = await supabase
    .from("households")
    .select("password")
    .eq("room_no", room_no)
    .maybeSingle();

  if (error) throw error;
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

  const { error: updateError } = await supabase
    .from("households")
    .update({ password: newPassword })
    .eq("room_no", room_no);

  if (updateError) throw updateError;
  return { ok: true };
}

export async function getPaymentsByRoom(room_no: string): Promise<Payment[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("room_no", room_no)
    .order("payment_month", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPayment);
}

export async function getPaymentForMonth(
  room_no: string,
  payment_month: string,
): Promise<Payment | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("room_no", room_no)
    .eq("payment_month", payment_month)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPayment(data) : undefined;
}

export async function getAllPaymentsForMonth(
  payment_month: string,
): Promise<Payment[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("payment_month", payment_month);

  if (error) throw error;
  return (data ?? []).map(mapPayment);
}

export async function getPaymentsForYear(year: number): Promise<Payment[]> {
  const prefix = `${year}-`;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .like("payment_month", `${prefix}%`);

  if (error) throw error;
  return (data ?? []).map(mapPayment);
}

export async function insertPayment(
  room_no: string,
  payment_month: string,
  paid_date: string,
): Promise<Payment> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .upsert(
      {
        room_no,
        payment_month,
        paid_date,
        status: "확인대기" as PaymentStatus,
      },
      { onConflict: "room_no,payment_month" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapPayment(data);
}

export async function getRoomPaymentState(
  room_no: string,
  payment_month: string,
): Promise<RoomPaymentState> {
  const payment = await getPaymentForMonth(room_no, payment_month);
  if (!payment) return "미입금";
  return payment.status;
}

export async function setRoomPaymentState(
  room_no: string,
  payment_month: string,
  state: RoomPaymentState,
): Promise<void> {
  const supabase = createAdminClient();

  if (state === "미입금") {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("room_no", room_no)
      .eq("payment_month", payment_month);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("payments").upsert(
    {
      room_no,
      payment_month,
      paid_date: new Date().toISOString().slice(0, 10),
      status: state,
    },
    { onConflict: "room_no,payment_month" },
  );

  if (error) throw error;
}

export async function getExpensesForMonth(
  expense_month: string,
): Promise<Expense[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("expense_month", expense_month);

  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function getExpensesForYear(year: number): Promise<Expense[]> {
  const prefix = `${year}-`;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .like("expense_month", `${prefix}%`);

  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function upsertExpensesForMonth(
  expense_month: string,
  items: Omit<Expense, "id" | "expense_month">[],
): Promise<void> {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("expense_month", expense_month);

  if (deleteError) throw deleteError;

  const rows = items.map((item) => ({
    expense_month,
    category: item.category,
    amount: item.amount,
    memo: item.memo ?? null,
  }));

  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from("expenses").insert(rows);
  if (insertError) throw insertError;
}

export async function resetDemoData(): Promise<void> {
  const supabase = createAdminClient();

  const { error: payDelError } = await supabase
    .from("payments")
    .delete()
    .neq("id", 0);
  if (payDelError) throw payDelError;

  const { error: expDelError } = await supabase
    .from("expenses")
    .delete()
    .neq("id", 0);
  if (expDelError) throw expDelError;

  const { error: hhResetError } = await supabase.from("households").update({
    password: DEFAULT_PASSWORD,
    is_admin: false,
    phone: "",
  });
  if (hhResetError) throw hhResetError;

  const { error: adminError } = await supabase
    .from("households")
    .update({
      is_admin: true,
      phone: BANK_INFO.adminPhone,
    })
    .eq("room_no", ADMIN_ROOM);
  if (adminError) throw adminError;

  const payments = buildDemoPayments();
  if (payments.length > 0) {
    const { error: payInsertError } = await supabase.from("payments").insert(
      payments.map((p) => ({
        room_no: p.room_no,
        payment_month: p.payment_month,
        paid_date: p.paid_date,
        status: p.status,
      })),
    );
    if (payInsertError) throw payInsertError;
  }

  const expenses = buildDemoExpenses();
  if (expenses.length > 0) {
    const { error: expInsertError } = await supabase.from("expenses").insert(
      expenses.map((e) => ({
        expense_month: e.expense_month,
        category: e.category,
        amount: e.amount,
        memo: e.memo ?? null,
      })),
    );
    if (expInsertError) throw expInsertError;
  }
}
