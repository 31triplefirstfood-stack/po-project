import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoNumber(poNumber: string) {
  const legacyMatch = poNumber.match(/^Bill(\d{4})(\d{2})(\d{2})-B(\d{3})$/)

  if (legacyMatch) {
    const [, thaiYear, month, day, sequence] = legacyMatch
    return `TAX${thaiYear}-${month}-B${sequence}`
  }

  const taxMatch = poNumber.match(/^TAX(\d{4})-(\d{2})-B(\d{3})$/)
  if (taxMatch) {
    const [, thaiYear, month, sequence] = taxMatch
    return `TAX${thaiYear}-${month}-B${sequence}`
  }

  return poNumber
}

export function formatProdNumber(id: string, date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const [yearStr, monthStr, dayStr] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d).split("-");
  const beYear = parseInt(yearStr, 10) + 543;
  const suffix = id.slice(-3).toUpperCase();
  return `PROD-${beYear}${monthStr}${dayStr}-${suffix}`;
}

export function parseBangkokDate(dateInput?: Date | string | null): Date {
  if (!dateInput) return new Date();
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(`${dateInput}T00:00:00.000Z`);
  }
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return new Date();
  const bangkokYMD = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return new Date(`${bangkokYMD}T00:00:00.000Z`);
}

