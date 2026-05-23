"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cn,
  formatMonthYearLabel,
  getCurrentMonth,
  getSelectableMonthKeys,
} from "@/lib/utils";

interface MonthSelectorProps {
  value: string;
  onChange: (month: string) => void;
  className?: string;
}

export function MonthSelector({ value, onChange, className }: MonthSelectorProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const months = getSelectableMonthKeys();
  const currentMonth = getCurrentMonth();
  const isCurrentMonth = value === currentMonth;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function selectMonth(month: string) {
    onChange(month);
    setOpen(false);
  }

  return (
    <>
      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full justify-between px-4 sm:flex-1"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            <span className="font-semibold">{formatMonthYearLabel(value)}</span>
            {!isCurrentMonth && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                과거 조회
              </span>
            )}
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
        </Button>
        {!isCurrentMonth && (
          <Button
            type="button"
            variant="outline"
            className="h-12 shrink-0"
            onClick={() => onChange(currentMonth)}
          >
            이번 달
          </Button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="month-selector-title"
            className="flex max-h-[min(70dvh,420px)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 id="month-selector-title" className="text-lg font-bold">
                조회 월 선택
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ul className="overflow-y-auto p-2">
              {months.map((month) => {
                const selected = month === value;
                const isThisMonth = month === currentMonth;
                return (
                  <li key={month}>
                    <button
                      type="button"
                      className={cn(
                        "touch-target flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base transition-colors",
                        selected
                          ? "bg-teal-50 font-semibold text-teal-900 ring-2 ring-teal-500"
                          : "hover:bg-slate-50",
                      )}
                      onClick={() => selectMonth(month)}
                    >
                      <span>{formatMonthYearLabel(month)}</span>
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        {isThisMonth && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                            이번 달
                          </span>
                        )}
                        {selected && <span aria-hidden>✓</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
