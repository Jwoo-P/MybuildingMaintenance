export type PaymentStatus = "확인대기" | "입금완료";

/** DB 기록 유무 포함, 화면·관리자용 입금 상태 */
export type RoomPaymentState = "미입금" | PaymentStatus;

export interface Household {
  id: string;
  room_no: string;
  password: string;
  is_admin: boolean;
  /** 입·수신 문자용 휴대폰 (숫자만 저장) */
  phone: string;
}

export interface Payment {
  id: number;
  room_no: string;
  payment_month: string;
  paid_date: string;
  status: PaymentStatus;
}

export interface Expense {
  id: number;
  expense_month: string;
  category: string;
  amount: number;
  memo?: string;
}

export interface Session {
  room_no: string;
  is_admin: boolean;
  /** 관리자가 세대원 화면으로 볼 때 선택한 호수 */
  view_as_room?: string;
}

export const ROOM_NUMBERS = [
  "B01",
  "B02",
  "101",
  "102",
  "201",
  "202",
  "301",
  "302",
  "401",
] as const;

export type RoomNo = (typeof ROOM_NUMBERS)[number];

export const ADMIN_ROOM: RoomNo = "401";

export const BANK_INFO = {
  bank: "국민은행",
  account: "123-456-789012",
  holder: "김관리",
  adminPhone: "01012345678",
};

export const MONTHLY_FEE = 20_000;

/** 초기·리셋 비밀번호 (4자리) */
export const DEFAULT_PASSWORD = "1234";
