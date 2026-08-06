import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getPaymentReceiptUrl } from "@/lib/paymentReceipt";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import type { ExpensePayment } from "@/hooks/useExpensePayments";

interface Props {
  payment: ExpensePayment | null;
  onOpenChange: (open: boolean) => void;
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-medium break-words">{value ?? "-"}</p>
  </div>
);

export const PaymentDetailsDialog = ({ payment, onOpenChange }: Props) => {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    setReceiptUrl(null);
    if (payment?.receipt_url) getPaymentReceiptUrl(payment.receipt_url).then(setReceiptUrl);
  }, [payment]);

  const isPdf = !!receiptUrl && receiptUrl.toLowerCase().includes(".pdf");

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>
        {payment && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Employee" value={payment.employee_name} />
              <Field label="Date" value={new Date(payment.date).toLocaleDateString()} />
              <Field label="Expense Type" value={payment.expense_type} />
              <Field label="Amount" value={`₹${payment.amount.toLocaleString("en-IN")}`} />
              <Field label="Mode" value={payment.payment_mode} />
              <Field label="Submitted" value={payment.created_at ? new Date(payment.created_at).toLocaleString() : "-"} />
              {payment.from_location && <Field label="From" value={payment.from_location} />}
              {payment.to_location && <Field label="To" value={payment.to_location} />}
              <Field label="HR Status" value={<PaymentStatusBadge status={payment.hr_status} />} />
              <Field label="Accounts Status" value={<PaymentStatusBadge status={payment.accounts_status} />} />
            </div>
            <Field label="Purpose of Payment" value={payment.purpose || payment.description} />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Receipt</p>
              {!payment.receipt_url ? (
                <p className="text-sm text-muted-foreground">No receipt uploaded</p>
              ) : !receiptUrl ? (
                <p className="text-sm text-muted-foreground">Loading preview…</p>
              ) : (
                <div className="space-y-2">
                  {isPdf ? (
                    <iframe src={receiptUrl} title="Receipt" className="w-full h-[60vh] rounded-lg border" />
                  ) : (
                    <img src={receiptUrl} alt="Payment receipt" className="max-h-[60vh] rounded-lg border object-contain" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => window.open(receiptUrl, "_blank", "noopener")}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};