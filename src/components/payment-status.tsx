import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "입금완료") {
    return <Badge variant="success">입금완료 🟢</Badge>;
  }
  return <Badge variant="warning">확인대기 🟡</Badge>;
}
