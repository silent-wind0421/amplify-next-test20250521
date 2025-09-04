// src/lib/utils.ts

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

// 時刻 "HH:mm" を JST の Date に
export function parseTimeInJST(dateYmd: string, time?: string | null): Date | undefined {
  if (!dateYmd || !time) return undefined;
  const t = time.length === 5 ? `${time}:00` : time; // "HH:mm" -> "HH:mm:00"
  const iso = `${dateYmd}T${t}+09:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

export function formatMinutes(min?: number | null): string {
  if (min == null) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

type VisitRecordLike = {
  actualArrivalTime?: string | null;
  actualLeaveTime?: string | null;
  contractedDuration?: number | null;
  actualDuration?: number | null;
};

// 0:未来所 / 1:利用中 / 2:短時間利用 / 3:利用完了
export function calcStatus(r: VisitRecordLike): "0" | "1" | "2" | "3" {
  const arrived = !!r.actualArrivalTime;
  const left = !!r.actualLeaveTime;
  if (!arrived) return "0";
  if (arrived && !left) return "1";
  if (
    r.actualDuration != null &&
    r.contractedDuration != null &&
    r.actualDuration < r.contractedDuration
  ) return "2";
  return "3";
}


// 契約利用時間の編集機能を切り替えるフラグ true→編集可 false→編集不可
export const ENABLE_CONTRACT_EDIT = false;

// 入力を "HH:mm" に正規化（例: "9"→"09:00", "930"→"09:30", "9:3"→"09:03"）
export function normalizeToHHmm(input: string): string {
  if (!input) return "";
  const raw = input.trim();
  const parts = raw.split(":");
  if (parts.length === 2) {
    const h = parts[0].replace(/\D/g, "");
    const m = parts[1].replace(/\D/g, "");
    if (!h && !m) return "";
    const hh = h.padStart(2, "0").slice(-2);
    const mm = m.padStart(2, "0").slice(-2);
    const mmNum = Number(mm);
    if (isNaN(mmNum) || mmNum > 59) return "";
    return `${hh}:${mm}`;
  }
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 2) return `${digits.padStart(2, "0")}:00`;
  const take = digits.slice(0, 4);
  const hh = take.slice(0, take.length - 2).padStart(2, "0").slice(-2);
  const mm = take.slice(-2);
  const mmNum = Number(mm);
  if (isNaN(mmNum) || mmNum > 59) return "";
  return `${hh}:${mm}`;
}

// "HH:mm" → 分（無効なら null）
export function hhmmToMinutes(hhmm: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}