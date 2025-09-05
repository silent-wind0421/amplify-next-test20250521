// src/lib/time-utils.ts
export const normalizeTimeInput = (raw: string): string | null => {
    const t = raw.replace(/[^\d]/g, "");
    if (t.length === 4) return `${t.slice(0, 2)}:${t.slice(2)}`;
    if (t.length === 3) return `0${t[0]}:${t.slice(1)}`;
    if (t.length === 2) return `${t}:00`;
    return null;
};

export const compareTime = (a?: Date | null, b?: Date | null): number => {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    return a.getTime() - b.getTime();
};

// HH:mm → 分
export const hhmmToMinutes = (hhmm?: string | null): number | null => {
    if (!hhmm) return null;
    const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
    if (!m) return null;
    const h = Number(m[1]), min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
};

// 分 → HH:mm（2桁固定）
export const minutesToHHmm = (mins: number): string => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// 同日扱いの差分（マイナスは0に丸め）
export const diffSameDay = (start?: string | null, end?: string | null): number | null => {
    const s = hhmmToMinutes(start);
    const e = hhmmToMinutes(end);
    if (s == null || e == null) return null;
    return Math.max(0, e - s);
};

// 並べ替え用：HH:mm の大小比較
export const compareHHmm = (a?: string | null, b?: string | null): number => {
    const am = hhmmToMinutes(a), bm = hhmmToMinutes(b);
    if (am == null && bm == null) return 0;
    if (am == null) return -1;
    if (bm == null) return 1;
    return am - bm;
};