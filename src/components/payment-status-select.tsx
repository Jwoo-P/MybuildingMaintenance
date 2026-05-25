"use client";

import type { RoomPaymentState } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: RoomPaymentState; label: string }[] = [
  { value: "미입금", label: "미입금" },
  { value: "확인대기", label: "확인대기" },
  { value: "입금완료", label: "입금완료" },
];

interface PaymentStatusSelectProps {
  value: RoomPaymentState;
  onChange: (state: RoomPaymentState) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function PaymentStatusSelect({
  value,
  onChange,
  id,
  className,
  disabled,
}: PaymentStatusSelectProps) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as RoomPaymentState)}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
