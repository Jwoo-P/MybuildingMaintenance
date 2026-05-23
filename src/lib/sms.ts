function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function openSms(phone: string, body: string): void {
  const encoded = encodeURIComponent(body);
  const separator = isIOS() ? "&" : "?";
  window.location.href = `sms:${phone}${separator}body=${encoded}`;
}

export function buildResidentNotifyMessage(
  roomNo: string,
  paymentMonth: string,
  paidDate: string,
): string {
  const monthLabel = paymentMonth.split("-")[1];
  const nMonth = Number(monthLabel);
  return `${roomNo}의 ${nMonth}월 관리비를 ${paidDate}에 입금했습니다. 확인 부탁드립니다.`;
}

import { BANK_INFO } from "./types";

export function buildAdminRemindMessage(roomNo: string): string {
  const { account, bank, holder } = BANK_INFO;
  return `안녕하세요, ${roomNo}님. 관리비 입금 확인 부탁드립니다. ${account} ${bank} ${holder}`;
}
