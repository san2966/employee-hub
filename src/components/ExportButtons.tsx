import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

interface ExportButtonsProps {
  portal: string;
  type: string;
  columns: { key: string; header: string }[];
  data: Record<string, any>[];
  dateRange?: { from?: string; to?: string };
  className?: string;
}

export const ExportButtons = ({
  portal,
  type,
  columns,
  data,
  dateRange,
  className = "",
}: ExportButtonsProps) => {
  const handleExportCSV = () => {
    exportToCSV({ portal, type, columns, data, dateRange });
  };

  const handleExportPDF = () => {
    exportToPDF({ portal, type, columns, data, dateRange });
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={data.length === 0}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={data.length === 0}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
};
