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
