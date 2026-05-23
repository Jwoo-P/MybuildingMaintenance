import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 해당 연도에서 표시할 월 목록 (미래 월 제외) */
export function getElapsedMonthKeys(year?: number): string[] {
  const y = year ?? getCurrentYear();
  const now = new Date();
  const currentYear = now.getFullYear();

  let maxMonth: number;
  if (y < currentYear) {
    maxMonth = 12;
  } else if (y > currentYear) {
    return [];
  } else {
    maxMonth = now.getMonth() + 1;
  }

  return Array.from({ length: maxMonth }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
}

/** 관리자 월 선택용 (과거 연도 포함, 최신순) */
export function getSelectableMonthKeys(startYear = 2024): string[] {
  const currentYear = getCurrentYear();
  const months: string[] = [];
  for (let y = startYear; y <= currentYear; y++) {
    months.push(...getElapsedMonthKeys(y));
  }
  return months.reverse();
}

export function formatMonthShort(paymentMonth: string): string {
  const [, month] = paymentMonth.split("-");
  return `${Number(month)}월`;
}

export function formatMonthLabel(paymentMonth: string): string {
  const [, month] = paymentMonth.split("-");
  return `${Number(month)}월`;
}

export function formatMonthYearLabel(paymentMonth: string): string {
  const [year, month] = paymentMonth.split("-");
  return `${year}년 ${Number(month)}월`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
