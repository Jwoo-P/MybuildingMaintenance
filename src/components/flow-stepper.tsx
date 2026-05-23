"use client";

import { cn } from "@/lib/utils";

export type FlowRole = "resident" | "admin" | "overview";

export interface FlowStep {
  id: string;
  label: string;
  description?: string;
}

const RESIDENT_STEPS: FlowStep[] = [
  { id: "login", label: "호수 선택", description: "3×3 그리드" },
  { id: "dashboard", label: "대시보드", description: "지출·입금 안내" },
  { id: "notify", label: "입금 알림", description: "DB → 문자" },
];

const ADMIN_STEPS: FlowStep[] = [
  { id: "login", label: "관리자 로그인", description: "401호" },
  { id: "overview", label: "총괄", description: "9세대 카드" },
  { id: "expenses", label: "지출 등록", description: "당월 비용" },
  { id: "detail", label: "세대 상세", description: "확인·독촉" },
];

interface FlowStepperProps {
  role: FlowRole;
  currentStepId: string;
  className?: string;
}

export function FlowStepper({
  role,
  currentStepId,
  className,
}: FlowStepperProps) {
  const steps = role === "admin" ? ADMIN_STEPS : RESIDENT_STEPS;
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav
      aria-label="서비스 플로우"
      className={cn("rounded-2xl border border-slate-200 bg-white p-3", className)}
    >
      <p className="mb-2 text-xs font-medium text-slate-500">
        {role === "admin" ? "관리자 플로우" : "세대원 플로우"}
      </p>
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = step.id === currentStepId;
          return (
            <li
              key={step.id}
              className={cn(
                "flex min-w-[72px] flex-1 flex-col items-center rounded-xl px-1 py-2 text-center transition-colors",
                active && "bg-teal-50 ring-2 ring-teal-500",
                done && !active && "bg-slate-50 opacity-80",
                !done && !active && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  active
                    ? "bg-teal-600 text-white"
                    : done
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-200 text-slate-600",
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className="text-[11px] font-semibold leading-tight">
                {step.label}
              </span>
              {step.description && (
                <span className="mt-0.5 text-[10px] text-slate-500">
                  {step.description}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
