// src/types/attendance.ts
export type StatusCode = "0" | "1" | "2" | "3";
export const STATUS_LABEL: Record<StatusCode, string> = {
    "0": "未来所",
    "1": "利用中",
    "2": "短時間利用",
    "3": "利用完了",
};

export type ReasonCode = "0" | "1" | "2" | "3" | "99";

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
