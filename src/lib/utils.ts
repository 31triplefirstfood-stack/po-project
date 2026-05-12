import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoNumber(poNumber: string) {
  const legacyMatch = poNumber.match(/^Bill(\d{4})(\d{2})(\d{2})-B(\d{3})$/)

  if (legacyMatch) {
    const [, thaiYear, month, , sequence] = legacyMatch
    return `TAX${thaiYear}-${month}-B${sequence}`
  }

  return poNumber
}

export function formatProdNumber(id: string, date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const beYear = d.getFullYear() + 543;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const suffix = id.slice(-3).toUpperCase();
  return `PROD-${beYear}${mm}${dd}-${suffix}`;
}

