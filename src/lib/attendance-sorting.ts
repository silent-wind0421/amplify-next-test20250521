import { compareTime } from "@/lib/time-utils";

export type SortColumn =
    | "userName"
    | "scheduledTime"
    | "contractTime"
    | "arrivalTime"
    | "departureTime"
    | "actualUsageTime"
    | "status";

export type SortDirection = "asc" | "desc";

/** 並び替えに必要な最小プロパティだけを定義 */
export type SortableRow = {
    id: string;
    userName: string;
    userNameKana?: string;
    scheduledTime: string;          // "HH:mm" or ""
    contractTime: string;           // "H:MM" or "HH:mm" or ""
    arrivalTime: Date | null;
    departureTime: Date | null;
    actualUsageTime: string | null; // "H:MM" or "HH:mm" or null
    isShortUsage: boolean;
    status: "0" | "1" | "2" | "3" | null;
};

const ja = new Intl.Collator("ja", { sensitivity: "base", numeric: true });

const toMinutes = (t?: string | null): number | null => {
    if (!t) return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m) return null;
    const h = Number(m[1]), mm = Number(m[2]);
    if (Number.isNaN(h) || Number.isNaN(mm)) return null;
    return h * 60 + mm;
};

/** 呼び出し元の型 T を保ったまま返す */
export function sortAttendance<T extends SortableRow>(
    data: T[],
    column: SortColumn,
    direction: SortDirection
): T[] {
    const dir = direction === "asc" ? 1 : -1;

    return [...data].sort((a, b) => {
        switch (column) {
            case "userName": {
                const ak = a.userNameKana ?? a.userName;
                const bk = b.userNameKana ?? b.userName;
                return ja.compare(ak, bk) * dir;
            }
            case "scheduledTime": {
                const am = toMinutes(a.scheduledTime), bm = toMinutes(b.scheduledTime);
                if (am == null && bm == null) return 0;
                if (am == null) return dir;
                if (bm == null) return -dir;
                return (am - bm) * dir;
            }
            case "contractTime": {
                const am = toMinutes(a.contractTime), bm = toMinutes(b.contractTime);
                if (am == null && bm == null) return 0;
                if (am == null) return dir;
                if (bm == null) return -dir;
                return (am - bm) * dir;
            }
            case "arrivalTime": {
                if (a.arrivalTime === null && b.arrivalTime === null) return 0;
                if (a.arrivalTime === null) return dir;
                if (b.arrivalTime === null) return -dir;
                return compareTime(a.arrivalTime, b.arrivalTime) * dir;
            }
            case "departureTime": {
                if (a.departureTime === null && b.departureTime === null) return 0;
                if (a.departureTime === null) return dir;
                if (b.departureTime === null) return -dir;
                return compareTime(a.departureTime, b.departureTime) * dir;
            }
            case "actualUsageTime": {
                const am = toMinutes(a.actualUsageTime), bm = toMinutes(b.actualUsageTime);
                if (am == null && bm == null) return 0;
                if (am == null) return dir;
                if (bm == null) return -dir;
                return (am - bm) * dir;
            }
            case "status": {
                // 未来所(0) < 利用中(1) < 短時間(2) < 完了(3)
                const rank = (r: SortableRow) =>
                    !r.arrivalTime ? 0 : !r.departureTime ? 1 : r.isShortUsage ? 2 : 3;
                const ra = rank(a), rb = rank(b);
                if (ra !== rb) return (ra - rb) * dir;

                // タイブレーク：かな→氏名→id
                const ak = a.userNameKana ?? a.userName;
                const bk = b.userNameKana ?? b.userName;
                const n = ja.compare(ak, bk);
                if (n !== 0) return n;
                return a.id.localeCompare(b.id);
            }
            default:
                return 0;
        }
    });
}
