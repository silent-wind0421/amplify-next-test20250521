// src/lib/utils.tsa

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz"

/**
 * 複数のクラス名を結合し、Tailwind CSS の競合クラスをマージする。
 *
 * `clsx` でクラス名を動的に構成し、`tailwind-merge` で重複や競合を解決する。
 *
 * @param {...ClassValue[]} inputs - 結合対象のクラス名（条件付きでも可）
 * @returns {string} 結果としてのクラス名文字列
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * JST（日本標準時）で Date オブジェクトを "HH:mm" 形式にフォーマットする。
 *
 * @param {Date | null} date - 対象の日付（null可）
 * @returns {string} JST における時間（例: "09:30"）、または空文字列
 */

export const formatTimeJST = (date: Date | null): string =>
  date ? formatInTimeZone(date, "Asia/Tokyo", "HH:mm") : "";