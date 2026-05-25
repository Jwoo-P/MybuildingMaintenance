import { Badge } from "@/components/ui/badge";
import type { PaymentStatus, RoomPaymentState } from "@/lib/types";

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus | RoomPaymentState;
}) {
  if (status === "입금완료") {
    return <Badge variant="success">입금완료 🟢</Badge>;
  }
  if (status === "미입금") {
    return <Badge variant="danger">미입금 🔴</Badge>;
  }
  return <Badge variant="warning">확인대기 🟡</Badge>;
}
