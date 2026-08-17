/** Portal-wide date formatting helpers. Standard display format is DD-MM-YYYY. */

const pad = (n: number) => String(n).padStart(2, "0");

const toDate = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/** DD-MM-YYYY */
export const formatDate = (value: string | number | Date | null | undefined): string => {
  const d = toDate(value);
  if (!d) return "-";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

/** DD-MM-YYYY hh:mm AM/PM */
export const formatDateTime = (value: string | number | Date | null | undefined): string => {
  const d = toDate(value);
  if (!d) return "-";
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${formatDate(d)} ${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
};

export const DATE_DISPLAY_FORMAT = "dd-MM-yyyy";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthLabel = (m?: number | null) => (m && m >= 1 && m <= 12 ? MONTHS[m - 1] : "-");

export const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => current + 1 - i);
})();
