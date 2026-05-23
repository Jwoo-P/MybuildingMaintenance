import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

export function YearlyOverviewLink() {
  return (
    <Button variant="outline" className="w-full" size="lg" asChild>
      <Link href="/payments/yearly">
        <CalendarRange className="h-5 w-5" />
        모든 세대 입금 현황 확인
      </Link>
    </Button>
  );
}
