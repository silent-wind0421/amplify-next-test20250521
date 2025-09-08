import { useEffect, useRef, useState } from "react";
import type { AttendanceData } from "@/types/attendance";
import { parseTimeInJST } from "@/lib/utils";
import { diffSameDay, minutesToHHmm } from "@/lib/time-utils";

// HH:mm → 固定日 Date（失敗は null）
const toFixedDateOrNull = (hhmm?: string | null): Date | null =>
    hhmm ? (parseTimeInJST("2000-01-01", hhmm) ?? null) : null;

// 親から受け取る client の最小型（必要なところだけ）
type AmplifyClient = {
    models: {
        Recipient: { list: (args?: any, opts?: any) => Promise<{ data: any[] }> };
        VisitRecord: { list: (args?: any, opts?: any) => Promise<{ data: any[] }> };
    };
};

export function useVisitRecords(selectedDate: Date, client: AmplifyClient) {
    const [data, setData] = useState<AttendanceData[]>([]);
    const lastJsonRef = useRef<string>("");

    async function fetchRecipientsMap(): Promise<Map<string, any>> {
        const res = await client.models.Recipient.list({}, { authMode: "userPool" });
        const map = new Map<string, any>();
        (res?.data ?? []).forEach((r: any) => r?.id && map.set(r.id, r));
        return map;
    }

    function transformVisitRecord(r: any, recMap: Map<string, any>): AttendanceData {
        const rec = r.recipientId ? recMap.get(r.recipientId) : undefined;

        const arrivalTime: Date | null = toFixedDateOrNull(r.actualArrivalTime);
        const departureTime: Date | null = toFixedDateOrNull(r.actualLeaveTime);
        const usedMins = diffSameDay(r.actualArrivalTime, r.actualLeaveTime);
        const actualUsageTime = usedMins == null ? null : minutesToHHmm(usedMins);

        return {
            id: r.id,
            _version: r._version,
            userName: rec ? `${rec.lastName ?? ""}${rec.firstName ?? ""}`.trim() || "未設定" : "未設定",
            userNameKana:
                rec && (rec.lastNameKana || rec.firstNameKana)
                    ? `${rec.lastNameKana ?? ""}${rec.firstNameKana ?? ""}`.trim()
                    : undefined,
            scheduledTime: r.plannedArrivalTime ?? "",
            contractTime:
                r.contractedDuration != null
                    ? `${Math.floor(r.contractedDuration / 60)}:${String(r.contractedDuration % 60).padStart(2, "0")}`
                    : "",
            arrivalTime,
            departureTime,
            actualUsageTime,
            reason: (r.reason ?? "0") as any, // ReasonCode への変換はお好みで
            note: r.note ?? null,
            isShortUsage:
                typeof r.contractedDuration === "number" &&
                typeof r.actualDuration === "number" &&
                r.actualDuration < r.contractedDuration,
            status: null, // 表示時に derive する/後で埋める
        };
    }

    async function refetch() {
        const ymd = selectedDate.toISOString().slice(0, 10);
        const recMap = await fetchRecipientsMap();
        const res = await client.models.VisitRecord.list({ visitDate: ymd }, { authMode: "userPool" });

        const mapped: AttendanceData[] = (res?.data ?? []).map((r: any) => transformVisitRecord(r, recMap));

        const json = JSON.stringify(mapped);
        if (json !== lastJsonRef.current) {
            lastJsonRef.current = json;
            setData(mapped);
        }
    }

    useEffect(() => {
        void refetch();
    }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, refetch };
}
