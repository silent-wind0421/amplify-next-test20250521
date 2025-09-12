// src/hooks/use-attendance-actions.ts
import { format } from "date-fns";
import { parseTimeInJST } from "@/lib/utils";
import {
    minutesToHHmm,
    hhmmToMinutes,
    normalizeTimeInput,
} from "@/lib/time-utils";
import { reasonText, type AttendanceData, type ReasonCode } from "@/types/attendance";


import type React from "react";
import { Message } from "@/components/common/message";
import { successToast, errorToast } from "@/lib/ui-toast";

// Amplify client の最小型（このファイル内で使う範囲だけ）
type AmplifyClient = {
    models: {
        VisitRecord: {
            update: (input: any, opts?: any) => Promise<any>;
            delete: (input: any, opts?: any) => Promise<any>;
        };
    };
};

type Options = {
    client: AmplifyClient;
    setAttendanceData: React.Dispatch<React.SetStateAction<AttendanceData[]>>;
    refetch?: () => Promise<unknown>;
    currentUserName?: string;
};

// 共通の結果型
export type ActionResult<T = void> =
    | { ok: true; data?: T }
    | { ok: false; error?: unknown };

const ok = <T>(data?: T): ActionResult<T> => ({ ok: true, data });
const ng = (error?: unknown): ActionResult => ({ ok: false, error });

// ------- ヘルパー（このファイル内で完結させる） -------
const normalizeToHHmm = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const n = normalizeTimeInput(String(raw)); // "930" → "09:30" など
    if (!n) return null;
    const m = /^(\d{2}):(\d{2})$/.exec(n);
    if (!m) return null;
    const h = Number(m[1]);
    const mm = Number(m[2]);
    if (h > 23 || mm > 59) return null;
    return n;
};

const toFixedDateOrNull = (hhmm: string | null): Date | null =>
    hhmm ? parseTimeInJST("2000-01-01", hhmm) ?? null : null;

const dateToMinutes = (d: Date | null): number | null =>
    d ? d.getHours() * 60 + d.getMinutes() : null;

const sameDayDiffMins = (start: Date | null, end: Date | null): number | null => {
    const s = dateToMinutes(start);
    const e = dateToMinutes(end);
    if (s == null || e == null) return null;
    return Math.max(0, e - s);
};
// ------------------------------------------------------

export function useAttendanceActions({
    client,
    setAttendanceData,
    refetch,
    currentUserName = "admin",
}: Options) {
    // 理由
    const updateReason = async (
        id: string,
        code: ReasonCode
    ): Promise<ActionResult<void>> => {
        setAttendanceData((prev) =>
            prev.map((r) => (r.id === id ? { ...r, reason: code } : r))
        );
        try {
            await client.models.VisitRecord.update(
                {
                    id,
                    reason: code,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            successToast(reasonText(code));
            return ok();
        } catch (e) {
            errorToast();
            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    // 備考
    const saveNote = async (
        id: string,
        value: string | null
    ): Promise<ActionResult<void>> => {
        setAttendanceData((prev) =>
            prev.map((r) => (r.id === id ? { ...r, note: value ?? null } : r))
        );
        try {
            await client.models.VisitRecord.update(
                {
                    id,
                    note: value ?? null,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            successToast("備考を保存しました");
            return ok();
        } catch (e) {
            errorToast();
            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    // 契約時間（HH:mm または null）
    const saveContractTime = async (
        id: string,
        raw: string | null
    ): Promise<ActionResult<void>> => {
        const hhmm = normalizeToHHmm(raw ?? "");
        if (raw && !hhmm) return ng(new Error("Invalid contract time"));
        const minutes = hhmmToMinutes(hhmm ?? "");
        setAttendanceData((prev) =>
            prev.map((r) => (r.id === id ? { ...r, contractTime: hhmm ?? "" } : r))
        );
        try {
            await client.models.VisitRecord.update(
                {
                    id,
                    contractedDuration: minutes ?? null,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            return ok();
        } catch (e) {
            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    // 手入力保存（来所/退所）
    const saveEditedTime = async (
        id: string,
        kind: "arrival" | "departure",
        raw: string
    ): Promise<ActionResult<void>> => {
        const hhmm = normalizeToHHmm(raw);
        if (!hhmm) return ng(new Error("Invalid time format"));
        setAttendanceData((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const nextArr = kind === "arrival" ? toFixedDateOrNull(hhmm) : r.arrivalTime;
                const nextDep = kind === "departure" ? toFixedDateOrNull(hhmm) : r.departureTime;
                const used = sameDayDiffMins(nextArr, nextDep);
                return {
                    ...r,
                    arrivalTime: nextArr,
                    departureTime: nextDep,
                    actualUsageTime: used == null ? null : minutesToHHmm(used),
                };
            })
        );
        try {
            const payload =
                kind === "arrival" ? { actualArrivalTime: hhmm } : { actualLeaveTime: hhmm };
            await client.models.VisitRecord.update(
                {
                    id,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            successToast(kind === "arrival" ? "来所を保存しました" : "退所を保存しました");
            return ok();
        } catch (e) {
            errorToast();
            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    // リセット（来所/退所）
    const resetTime = async (
        id: string,
        kind: "arrival" | "departure"
    ): Promise<ActionResult<void>> => {
        setAttendanceData((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const nextArr = kind === "arrival" ? null : r.arrivalTime;
                const nextDep = kind === "departure" ? null : r.departureTime;
                const used = sameDayDiffMins(nextArr, nextDep);
                return {
                    ...r,
                    arrivalTime: nextArr,
                    departureTime: nextDep,
                    actualUsageTime: used == null ? null : minutesToHHmm(used),
                };
            })
        );
        try {
            const payload =
                kind === "arrival"
                    ? { actualArrivalTime: null }
                    : { actualLeaveTime: null };
            await client.models.VisitRecord.update(
                {
                    id,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            successToast(kind === "arrival" ? "来所をリセットしました" : "退所をリセットしました");
            return ok();
        } catch (e) {
            errorToast();
            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    // 来所（現在時刻）
    const handleArrival = async (
        id: string
    ): Promise<ActionResult<void>> => {
        const now = new Date();
        const hhmm = format(now, "HH:mm");
        setAttendanceData((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, arrivalTime: toFixedDateOrNull(hhmm) } : r
            )
        );
        try {
            await client.models.VisitRecord.update(
                {
                    id,
                    actualArrivalTime: hhmm,
                    updatedAt: now.toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            successToast("来所を記録しました");
            return ok();
        } catch (e) {
            errorToast();
            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    // 退所（現在時刻）
    const handleDeparture = async (
        id: string
    ): Promise<ActionResult<void>> => {
        const now = new Date();
        const hhmm = format(now, "HH:mm");
        setAttendanceData((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const newDep = toFixedDateOrNull(hhmm);
                const used = sameDayDiffMins(r.arrivalTime, newDep);
                const contractMin = hhmmToMinutes(r.contractTime) ?? null;
                return {
                    ...r,
                    departureTime: newDep,
                    actualUsageTime: used == null ? null : minutesToHHmm(used),
                    // 契約時間が設定されていれば短時間判定を即時反映
                    isShortUsage: used != null && contractMin != null ? used < contractMin : false,
                };
            })
        );
        try {
            await client.models.VisitRecord.update(
                {
                    id,
                    actualLeaveTime: hhmm,
                    updatedAt: now.toISOString(),
                    updatedBy: currentUserName,
                },
                { authMode: "userPool" }
            );
            successToast("退所を記録しました");
            return ok();
        } catch (e) {
            errorToast();

            console.error(e);
            if (refetch) await refetch();
            return ng(e);
        }
    };

    const deleteVisitRecord = async (row: AttendanceData): Promise<ActionResult<void>> => {
        // ① 楽観更新（まずUIから消す）
        setAttendanceData(prev => prev.filter(x => x.id !== row.id));

        try {
            // ② サーバ削除（Amplifyの呼び方はあなたの他の関数に合わせて）
            await client.models.VisitRecord.delete(
                { id: row.id },
                { authMode: "userPool" }
            );

            // ③ トースト → ④ 正常終了
            successToast(Message.IA000004, { description: "削除しました" });
            return ok();
        } catch (e) {
            // ⑤ 失敗時：トースト & ロールバック(refetch)
            errorToast(Message.EF050021, { description: Message.EF050020 });
            if (refetch) await refetch();
            return ng(e);
        }
    };


    return {
        updateReason,
        saveNote,
        saveContractTime,
        saveEditedTime,
        resetTime,
        handleArrival,
        handleDeparture,
        deleteVisitRecord,
    };
}
