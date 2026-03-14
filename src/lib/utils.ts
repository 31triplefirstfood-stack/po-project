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
