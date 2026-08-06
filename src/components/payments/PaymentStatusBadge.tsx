import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Approved: "bg-success/15 text-success",
  Paid: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Hold: "bg-warning/15 text-warning",
  "Changes Required": "bg-warning/15 text-warning",
};

export const PaymentStatusBadge = ({ status }: { status?: string | null }) => {
  const value = status || "Pending";
  return (
    <Badge variant="outline" className={`border-transparent font-medium ${STYLES[value] || STYLES.Pending}`}>
      {value}
    </Badge>
  );
};