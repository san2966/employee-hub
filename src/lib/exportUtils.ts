import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Company branding configuration
const COMPANY_NAME = "VMCC";
const COMPANY_TAGLINE = "Employee Management System";

interface ExportConfig {
  portal: string;
  type: string;
  columns: { key: string; header: string }[];
  data: Record<string, any>[];
  dateRange?: { from?: string; to?: string };
}

// Generate filename in format: Emp_[Portal]_[Type]_[YYYYMMDD].csv/pdf
const generateFilename = (portal: string, type: string, extension: string): string => {
  const dateStr = format(new Date(), "yyyyMMdd");
  return `Emp_${portal}_${type}_${dateStr}.${extension}`;
};

// Export to CSV using PapaParse
export const exportToCSV = (config: ExportConfig): void => {
  const { portal, type, columns, data } = config;

  // Prepare data with proper column headers
  const csvData = data.map((row) => {
    const formattedRow: Record<string, any> = {};
    columns.forEach((col) => {
      let value = row[col.key];
      // Format dates
      if (value && typeof value === "string" && !isNaN(Date.parse(value))) {
        const date = new Date(value);
        if (date.getFullYear() > 1990) {
          value = format(date, "yyyy-MM-dd");
        }
      }
      // Format amounts
      if (typeof value === "number") {
        value = value.toLocaleString("en-IN");
      }
      formattedRow[col.header] = value ?? "";
    });
    return formattedRow;
  });

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = generateFilename(portal, type, "csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export to PDF using jsPDF + autoTable
export const exportToPDF = (config: ExportConfig): void => {
  const { portal, type, columns, data, dateRange } = config;

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header - Company branding
  doc.setFillColor(30, 58, 138); // primary color
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, 14, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_TAGLINE, 14, 22);

  // Report title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const reportTitle = `${portal} - ${type} Report`;
  doc.text(reportTitle, 14, 42);

  // Date range and export timestamp
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  let yPos = 48;
  if (dateRange?.from || dateRange?.to) {
    const rangeText = `Date Range: ${dateRange.from || "N/A"} to ${dateRange.to || "N/A"}`;
    doc.text(rangeText, 14, yPos);
    yPos += 5;
  }

  doc.text(`Exported on: ${format(new Date(), "PPpp")}`, 14, yPos);
  doc.text(`Total Records: ${data.length}`, pageWidth - 50, yPos);

  // Prepare table data
  const tableHeaders = columns.map((col) => col.header);
  const tableData = data.map((row) =>
    columns.map((col) => {
      let value = row[col.key];
      // Format dates
      if (value && typeof value === "string" && !isNaN(Date.parse(value))) {
        const date = new Date(value);
        if (date.getFullYear() > 1990) {
          value = format(date, "yyyy-MM-dd");
        }
      }
      // Format amounts
      if (typeof value === "number") {
        value = `₹${value.toLocaleString("en-IN")}`;
      }
      return value ?? "-";
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPos + 8,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(generateFilename(portal, type, "pdf"));
};

// Common export columns by data type
export const EXPORT_COLUMNS = {
  tasks: [
    { key: "subject", header: "Task" },
    { key: "description", header: "Description" },
    { key: "employeeName", header: "Employee" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Created Date" },
  ],
  reports: [
    { key: "employeeName", header: "Employee Name" },
    { key: "date", header: "Date" },
    { key: "department", header: "Department" },
    { key: "task", header: "Task" },
    { key: "status", header: "Status" },
    { key: "description", header: "Description" },
  ],
  leaves: [
    { key: "employeeName", header: "Employee Name" },
    { key: "date", header: "Leave Date" },
    { key: "type", header: "Leave Type" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Submitted On" },
  ],
  employees: [
    { key: "name", header: "Name" },
    { key: "username", header: "Username" },
    { key: "designation", header: "Designation" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "dateOfJoining", header: "Date of Joining" },
  ],
  contacts: [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "designation", header: "Designation" },
    { key: "organization", header: "Organization" },
  ],
  vouchers: [
    { key: "employeeName", header: "Employee Name" },
    { key: "amount", header: "Amount (₹)" },
    { key: "date", header: "Date" },
    { key: "purpose", header: "Purpose" },
    { key: "timestamp", header: "Submitted On" },
  ],
  travelExpenses: [
    { key: "employeeName", header: "Employee Name" },
    { key: "from", header: "From" },
    { key: "to", header: "To" },
    { key: "date", header: "Date" },
    { key: "amount", header: "Amount (₹)" },
    { key: "purpose", header: "Purpose" },
  ],
  visitors: [
    { key: "name", header: "Visitor Name" },
    { key: "mobile", header: "Mobile" },
    { key: "organization", header: "Organization" },
    { key: "whomToMeet", header: "Meeting With" },
    { key: "purpose", header: "Purpose" },
    { key: "checkInTime", header: "Check-in Time" },
  ],
  payments: [
    { key: "date", header: "Date" },
    { key: "purpose", header: "Purpose" },
    { key: "amount", header: "Amount (₹)" },
  ],
  assets: [
    { key: "name", header: "Asset Name" },
    { key: "category", header: "Category" },
    { key: "brand", header: "Brand" },
    { key: "serialNumber", header: "Serial Number" },
    { key: "condition", header: "Condition" },
    { key: "cost", header: "Cost (₹)" },
    { key: "purchaseDate", header: "Purchase Date" },
    { key: "assignedTo", header: "Assigned To" },
  ],
  vehicleAssignments: [
    { key: "vehicleInfo", header: "Vehicle" },
    { key: "date", header: "Date" },
    { key: "employeeName", header: "Employee" },
    { key: "previousKm", header: "Previous Km" },
    { key: "currentKm", header: "Current Km" },
  ],
  itAssets: [
    { key: "registrationNumber", header: "Registration #" },
    { key: "type", header: "Type" },
    { key: "brand", header: "Brand" },
    { key: "model", header: "Model" },
    { key: "serialNumber", header: "Serial Number" },
    { key: "assignedToName", header: "Assigned To" },
    { key: "warrantyTill", header: "Warranty Till" },
  ],
  tickets: [
    { key: "ticket_number", header: "Ticket #" },
    { key: "name", header: "Requester" },
    { key: "email", header: "Email" },
    { key: "subject", header: "Subject" },
    { key: "status", header: "Status" },
    { key: "created_at", header: "Created Date" },
    { key: "resolved_at", header: "Resolved Date" },
  ],
  personalTasks: [
    { key: "subject", header: "Task" },
    { key: "description", header: "Description" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Created Date" },
  ],
  miscPayments: [
    { key: "date", header: "Date" },
    { key: "purpose", header: "Purpose" },
    { key: "amount", header: "Amount (₹)" },
  ],
};
