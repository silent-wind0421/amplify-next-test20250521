// src/types/attendance.ts
export type StatusCode = "0" | "1" | "2" | "3";
export const STATUS_LABEL: Record<StatusCode, string> = {
    "0": "未来所",
    "1": "利用中",
    "2": "短時間利用",
    "3": "利用完了",
};

export type ReasonCode = "0" | "1" | "2" | "3" | "99";

export const REASON_LABEL: Record<ReasonCode, string> = {
    "0": "未選択",
    "1": "児童都合",
    "2": "保護者都合",
    "3": "事業者都合",
    "99": "その他",
};

export const REASON_VALUES = ["0", "1", "2", "3", "99"] as const;

export const toReasonCode = (v: unknown): ReasonCode =>
    (REASON_VALUES as readonly string[]).includes(String(v)) ? (v as ReasonCode) : "0";

// 便利関数（任意）
export const reasonText = (code: ReasonCode | null) =>
    REASON_LABEL[(code ?? "0") as ReasonCode];


export type AttendanceData = {
    id: string;
    _version: number;
    userName: string;
    userNameKana?: string;
    scheduledTime: string;
    contractTime: string;
    arrivalTime: Date | null;
    departureTime: Date | null;
    actualUsageTime: string | null;
    isShortUsage: boolean;
    reason: ReasonCode | null;
    note: string | null;
    status: StatusCode | null;
};
