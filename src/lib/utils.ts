// src/lib/utils.tsa

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * JST固定で Date → "HH:mm" にフォーマット
 */
export const formatTimeJST = (date: Date | null): string =>
  date ? formatInTimeZone(date, "Asia/Tokyo", "HH:mm") : "";