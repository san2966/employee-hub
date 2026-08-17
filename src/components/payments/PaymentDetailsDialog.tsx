import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getPaymentReceiptUrl } from "@/lib/paymentReceipt";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatDateTime, monthLabel } from "@/lib/dateFormat";
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
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const storedPath = payment?.sheet_url || payment?.receipt_url || null;

  useEffect(() => {
    setFileUrl(null);
    if (storedPath) getPaymentReceiptUrl(storedPath).then(setFileUrl);
  }, [storedPath]);

  const lower = (storedPath || "").toLowerCase();
  const isPdf = lower.endsWith(".pdf");
  const isImage = /\.(png|jpe?g|gif|webp)$/.test(lower);

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense Sheet Details</DialogTitle>
        </DialogHeader>
        {payment && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Employee Name" value={payment.display_name || payment.employee_name} />
              <Field label="Month" value={monthLabel(payment.month)} />
              <Field label="Year" value={payment.year ?? "-"} />
              <Field label="HR Status" value={<PaymentStatusBadge status={payment.hr_status} />} />
              <Field label="Accounts Status" value={<PaymentStatusBadge status={payment.accounts_status} />} />
              <Field label="Submitted" value={formatDateTime(payment.created_at)} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Expense Sheet</p>
              {!storedPath ? (
                <p className="text-sm text-muted-foreground">No file uploaded</p>
              ) : !fileUrl ? (
                <p className="text-sm text-muted-foreground">Loading preview…</p>
              ) : (
                <div className="space-y-2">
                  {isPdf ? (
                    <iframe src={fileUrl} title="Expense sheet" className="w-full h-[60vh] rounded-lg border" />
                  ) : isImage ? (
                    <img src={fileUrl} alt="Expense sheet" className="max-h-[60vh] rounded-lg border object-contain" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Spreadsheet files cannot be previewed in the browser — open it in a new tab to download.
                    </p>
                  )}
                  <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, "_blank", "noopener")}>
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
