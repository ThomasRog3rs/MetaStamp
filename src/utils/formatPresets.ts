export interface FormatPreset {
  value: string;
  label: string;
  example: string;
}

export const DATE_FORMAT_PRESETS: FormatPreset[] = [
  { value: "YYYY-MM-DD", label: "ISO (2026-01-18)", example: "2026-01-18" },
  { value: "MM/DD/YYYY", label: "US (01/18/2026)", example: "01/18/2026" },
  { value: "DD/MM/YYYY", label: "EU (18/01/2026)", example: "18/01/2026" },
  { value: "DD MMM YYYY", label: "Short (18 Jan 2026)", example: "18 Jan 2026" },
  { value: "MMMM DD, YYYY", label: "Long (January 18, 2026)", example: "January 18, 2026" },
  { value: "DD.MM.YYYY", label: "Dotted (18.01.2026)", example: "18.01.2026" },
];

export const TIME_FORMAT_PRESETS: FormatPreset[] = [
  { value: "HH:mm:ss", label: "24h with seconds (14:30:45)", example: "14:30:45" },
  { value: "HH:mm", label: "24h (14:30)", example: "14:30" },
  { value: "hh:mm:ss A", label: "12h with seconds (02:30:45 PM)", example: "02:30:45 PM" },
  { value: "hh:mm A", label: "12h (02:30 PM)", example: "02:30 PM" },
  { value: "", label: "No time", example: "" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatDate(date: Date, format: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  
  return format
    .replace("YYYY", date.getFullYear().toString())
    .replace("MMMM", MONTH_NAMES[date.getMonth()])
    .replace("MMM", MONTH_SHORT[date.getMonth()])
    .replace("MM", pad(date.getMonth() + 1))
    .replace("DD", pad(date.getDate()))
    .replace("HH", pad(hours24))
    .replace("hh", pad(hours12))
    .replace("mm", pad(date.getMinutes()))
    .replace("ss", pad(date.getSeconds()))
    .replace("A", ampm);
}

export function combineFormats(dateFormat: string, timeFormat: string): string {
  if (!timeFormat) {
    return dateFormat;
  }
  return `${dateFormat} ${timeFormat}`;
}

export function getPreviewTimestamp(format: string): string {
  return formatDate(new Date(), format);
}
