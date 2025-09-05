/**
 * @file 通所実績管理画面のメインコンポーネント
 * @description DynamoDB（VisitRecord）からの実績取得・編集・表示を行うUI実装
 * @module AttendanceManagement
 */

//src/componets/attendance-management.tsx
"use client";

import { fetchAuthSession } from "@aws-amplify/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ja } from "date-fns/locale";
import { formatTimeJST } from "@/lib/utils";
import {
  Calendar,
  Edit2,
  Check,
  XIcon,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import NoteDialog from "@/components/attendance/note-dialog";
import ReasonSelect from "@/components/attendance/reason-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSidebar } from "@/context/sidebar-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ENABLE_CONTRACT_EDIT,
  normalizeToHHmm,
  hhmmToMinutes,
} from "@/lib/utils";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Message } from "../components/common/message";

import { parseTimeInJST, formatMinutes, calcStatus } from "@/lib/utils";

import { normalizeTimeInput, compareTime } from "@/lib/time-utils";

const client = generateClient<Schema>({ authMode: "userPool" });

// status（今あるやつ）はそのまま維持
type StatusCode = "0" | "1" | "2" | "3";
const STATUS_LABEL: Record<StatusCode, string> = {
  "0": "未来所",
  "1": "利用中",
  "2": "短時間利用",
  "3": "利用完了",
};

// コード値のドメイン
const REASON_VALUES = ["0", "1", "2", "3", "99"] as const;
type ReasonCode = (typeof REASON_VALUES)[number];

export const REASON_LABEL: Record<ReasonCode, string> = {
  "0": "未選択",
  "1": "児童都合",
  "2": "保護者都合",
  "3": "事業者都合",
  "99": "その他",
};

// 日本語→コード に直す（未知は "0"）
export const REASON_CODE: Record<string, ReasonCode> = {
  未選択: "0",
  児童都合: "1",
  保護者都合: "2",
  事業者都合: "3",
  その他: "99",
};

// 何が来てもコードに丸めるガード
export const toReasonCode = (v: unknown): ReasonCode =>
  REASON_VALUES.includes(v as ReasonCode) ? (v as ReasonCode) : "0";

const jaCollator = new Intl.Collator("ja", {
  sensitivity: "base",
  numeric: true,
});

function calcDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * 通所実績データを表す型。
 * 各児童に対して、当日の来所・退所・利用状況などを表現する。
 */

const deriveStatus = (
  arrival: Date | null,
  leave: Date | null,
  isShort: boolean
): StatusCode => {
  if (!arrival) return "0";
  if (!leave) return "1";
  return isShort ? "2" : "3";
};

type AttendanceData = {
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

// ソート用の型定義
type SortColumn =
  | "userName"
  | "scheduledTime"
  | "contractTime"
  | "arrivalTime"
  | "departureTime"
  | "actualUsageTime"
  | "Badge";
type SortDirection = "asc" | "desc";

// 変換ユーティリティ（非async）
const transformVisitRecord = (record: any, rec?: any) => {
  const userName = rec
    ? `${rec.lastName ?? ""}${rec.firstName ?? ""}`
    : "未設定";
  const userNameKana =
    rec && (rec.lastNameKana || rec.firstNameKana)
      ? `${rec.lastNameKana ?? ""}${rec.firstNameKana ?? ""}`
      : undefined;

  const arrivalTime = record.actualArrivalTime
    ? new Date(`${record.visitDate}T${record.actualArrivalTime}`)
    : null;

  const departureTime = record.actualLeaveTime
    ? new Date(`${record.visitDate}T${record.actualLeaveTime}`)
    : null;

  const contractTime = record.contractedDuration
    ? `${Math.floor(record.contractedDuration / 60)}:${`${record.contractedDuration % 60}`.padStart(2, "0")}`
    : "";

  const actualUsageTime = record.actualDuration
    ? `${Math.floor(record.actualDuration / 60)}:${`${record.actualDuration % 60}`.padStart(2, "0")}`
    : null;

  const isShortUsage =
    typeof record.contractedDuration === "number" &&
    typeof record.actualDuration === "number"
      ? record.actualDuration < record.contractedDuration
      : false;

  const status: StatusCode =
    (record.status as StatusCode) ??
    deriveStatus(arrivalTime, departureTime, isShortUsage);

  return {
    id: record.id,
    _version: record._version,
    userName, // ← 重複させない
    userNameKana, // ← 重複させない
    scheduledTime: record.plannedArrivalTime ?? "",
    contractTime,
    arrivalTime,
    departureTime,
    actualUsageTime,
    reason: toReasonCode(record.reason ?? "0"),
    note: record.note ?? null,
    isShortUsage,
    status,
  };
};

/**
 * 通所実績管理画面のメインコンポーネント。
 *
 * - DynamoDB（VisitRecord）からの実績取得
 * - 来所・退所の記録と編集（手動入力/自動記録）
 * - ソート・ステータス表示・理由や備考の編集など多機能対応
 *
 * @returns {JSX.Element} 実績管理画面全体を構成するReact要素
 */

export default function AttendanceManagement() {
  //　メニュー開閉
  const { toggle } = useSidebar();
  const { isOpen } = useSidebar();

  // 現在の画面幅（レスポンシブ表示制御用）
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  // 編集状態を管理するステートとRefを追加
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(false);

  // setEditing関数を使って、両方の状態を同時に更新
  const setEditing = (value: boolean) => {
    setIsEditing(value);
    isEditingRef.current = value;
  };

  // AttendanceManagement() 内に追加
  const [editingContract, setEditingContract] = useState<{
    id: string;
    value: string;
  } | null>(null);

  const saveContractTime = async (id: string, value: string) => {
    const normalized = normalizeToHHmm(value);
    const minutes = hhmmToMinutes(normalized);
    if (minutes == null) {
      toast("契約利用時間は HH:mm で入力してください（例: 02:30）");
      return;
    }

    // ローカル反映
    setAttendanceData((prev) =>
      prev.map((v) => (v.id === id ? { ...v, contractTime: normalized } : v))
    );
    setEditingContract(null);

    try {
      await client.models.VisitRecord.update(
        { id, contractedDuration: minutes },
        { authMode: "userPool" }
      );
      toast("契約利用時間を更新しました", { description: normalized });
    } catch (e) {
      console.error(e);
      toast("契約利用時間の更新に失敗しました");
    }
  };

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<{
    id: string;
    type: "arrival" | "departure";
    value: string;
  } | null>(null);
  const [editingNote, setEditingNote] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({ column: "userName", direction: "asc" });
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);

  const formatToHHMM = (value: string): string => {
    const digits = value.replace(/\D/g, ""); //数字のみ取り出す

    if (digits.length === 3) {
      return `0${digits[0]}:${digits.slice(1)}`; // 900 → 09:00
    } else if (digits.length === 4) {
      return `${digits.slice(0, 2)}:${digits.slice(2)}`; // 1234 → 12:34
    } else {
      return value; // 変換できない場合はそのまま
    }
  };
  // State: 児童マスタと前回取得データのキャッシュ
  const [recipientMap, setRecipientMap] = useState<Map<string, any>>(new Map());
  const [lastFetchedJson, setLastFetchedJson] = useState<string>("");

  useEffect(() => {
    const fetchChildMaster = async () => {
      try {
        // ... recipients を list で取得
        const { data: recipients } = await (
          client.models.Recipient as any
        ).list(
          {
            selection: (r: any) => [
              r.recipientId(),
              r.lastName(),
              r.firstName(),
              r.lastNameKana(),
              r.firstNameKana(),
            ],
            limit: 1000,
          },
          { authMode: "userPool" }
        );

        // ID→氏名の Map を作成して state に保持
        const map = new Map<string, any>(
          (recipients ?? [])
            .filter((r: any) => r.recipientId != null)
            .map((r: any) => [r.recipientId!, r]) // ← 丸ごと入れる
        );
        setRecipientMap(map);
      } catch (error) {
        console.error("児童マスタの取得に失敗:", error);
      }
    };

    fetchChildMaster();
  }, []);

  /**
   * 通所実績を取得してステートを更新する。
   * 無駄な更新を避けるため、前回と同一であれば更新しない。
   */

  const toDateTime = (date: Date, timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours);
    result.setMinutes(minutes);
    result.setSeconds(0);
    result.setMilliseconds(0);
    return result;
  };

  /**
   * 選択中の日付に該当する通所実績を取得し、state に反映する。
   * VisitRecord.child のリレーションから児童名を取得する。
   */
  const fetchVisitRecords = async () => {
    try {
      const ymd = formatInTimeZone(selectedDate, "Asia/Tokyo", "yyyy-MM-dd");
      console.log("検索日付:", ymd);

      // 1) VisitRecord を取得（recipientId を含める）

      const { data: records } = await (client.models.VisitRecord as any).list(
        {
          filter: { visitDate: { eq: ymd } },
          selection: (r: any) => [
            r.id(),
            r.visitRecordId(),
            r.visitDate(),
            r.officeId(),
            r.recipientId(), // ← これで join キー取得
            r.plannedArrivalTime(),
            r.contractedDuration(),
            r.status(),
            r.actualArrivalTime(),
            r.actualLeaveTime(),
            r.actualDuration(),
            r.reason(),
            r.note(),
            r._version(),
          ],
        },
        { authMode: "userPool" }
      );

      if (!records) {
        console.warn("VisitRecordデータが取得できませんでした");
        return;
      }

      // 変更検出（再描画最適化）
      const currentJson = JSON.stringify(records);
      if (currentJson === lastFetchedJson) {
        console.log("同一データのため再描画をスキップ");
        return;
      }
      setLastFetchedJson(currentJson);

      // 2) Recipient を一括取得 → 必要IDだけ Map 化
      const ids = Array.from(
        new Set(records.map((r: any) => r.recipientId).filter(Boolean))
      );

      const { data: recAll } = await (client.models.Recipient as any).list(
        {
          selection: (x: any) => [
            x.recipientId(),
            x.lastName(),
            x.firstName(),
            x.lastNameKana(),
            x.firstNameKana(),
          ],
          limit: 1000,
        },
        { authMode: "userPool" }
      );

      console.log("Recipient件数:", recAll?.length, recAll?.slice(0, 3));

      const recMap = new Map<string, any>();
      (recAll ?? [])
        .filter((r: any) => ids.includes(r.recipientId))
        .forEach((r: any) => recMap.set(r.recipientId, r));

      // デバッグ（突き合わせ確認）
      console.log(
        "records件数:",
        records.length,
        "recipient候補件数:",
        recAll?.length ?? 0
      );
      console.log("Joinキー例:", ids.slice(0, 5));
      console.log("recMapキー例:", Array.from(recMap.keys()).slice(0, 5));

      // 3) 画面用に整形（recMap から氏名を引く）
      const mapped: AttendanceData[] = (records ?? []).map((r: any) => {
        const rec = r.recipientId ? recMap.get(r.recipientId) : undefined;

        return {
          id: r.id,
          // 氏名
          userName: rec
            ? `${rec.lastName ?? ""}${rec.firstName ?? ""}`.trim() || "未設定"
            : "未設定",
          userNameKana:
            rec && (rec.lastNameKana || rec.firstNameKana)
              ? `${rec.lastNameKana ?? ""}${rec.firstNameKana ?? ""}`.trim()
              : undefined,

          // 時刻・時間
          scheduledTime: r.plannedArrivalTime ?? "",
          contractTime:
            r.contractedDuration != null
              ? `${Math.floor(r.contractedDuration / 60)}:${String(r.contractedDuration % 60).padStart(2, "0")}`
              : "",
          arrivalTime: r.actualArrivalTime
            ? parseTimeInJST(r.visitDate, r.actualArrivalTime)
            : null,
          departureTime: r.actualLeaveTime
            ? parseTimeInJST(r.visitDate, r.actualLeaveTime)
            : null,
          actualUsageTime:
            r.actualDuration != null ? formatMinutes(r.actualDuration) : null,

          // ステータス/理由/備考
          status: calcStatus(r),
          reason: toReasonCode(r.reason ?? "0"),
          note: r.note ?? null,
          isShortUsage:
            typeof r.contractedDuration === "number" &&
            typeof r.actualDuration === "number" &&
            r.actualDuration < r.contractedDuration,
        };
      });

      setAttendanceData(mapped);
      console.log("AttendanceData 更新完了:", mapped);
    } catch (error) {
      console.error("通所実績の取得に失敗:", error);
    }
  };

  /**
   * 通所実績を 10 秒おきに自動取得。
   * タブが非アクティブなときはスキップする。
   */
  useEffect(() => {
    fetchVisitRecords(); // 初回即実行

    // const intervalId = setInterval(() => {
    //   if (document.visibilityState === "visible") {
    //     fetchVisitRecords();
    //   }
    // }, 10000); // 10秒

    // return () => clearInterval(intervalId);
  }, [recipientMap, selectedDate]); // recipientMap に依存（受給者マスタ取得完了後に開始）

  // 現在の日付
  const formattedDate = format(selectedDate, "yyyy年MM月dd日(E)", {
    locale: ja,
  });

  // 現在時刻の更新
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(format(now, "HH:mm:ss"));
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 来所ボタンのハンドラー
  const handleArrival = async (id: string) => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");

    // ローカルUIの更新
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) =>
        item.id === id ? { ...item, arrivalTime: now } : item
      )
    );

    try {
      // DynamoDBの更新
      await client.models.VisitRecord.update(
        {
          id: id,
          actualArrivalTime: currentTime,
          status: "1",
          updatedAt: now.toISOString(),
          updatedBy: "admin", // 実際のログインユーザー名に差し替え可
        },
        {
          authMode: "userPool",
        }
      );

      toast(Message.IA000001, {
        description: `現在時刻: ${currentTime}`,
      });
    } catch (error) {
      console.error("来所時刻の更新に失敗しました:", error);

      toast(
        <div>
          <div className="font-bold text-destructive">エラー</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050012}
          </div>
        </div>,
        {
          duration: 5000,
          icon: "❌",
          className: "bg-destructive text-destructive-foreground",
        }
      );

      // 必要であればここで setAttendanceData をロールバックしてもよい
    }
  };

  // 退所ボタンのハンドラー
  const handleDeparture = async (id: string) => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");

    // 更新対象の item を state から先に取得
    const target = attendanceData.find((item) => item.id === id);
    if (!target) return;

    // 実利用時間を計算
    const updatedItem = calculateUsageTime(target, now);

    // DynamoDB 更新
    try {
      const actualDuration = updatedItem.actualUsageTime
        ? (() => {
            const [h, m] = updatedItem.actualUsageTime.split(":").map(Number);
            return h * 60 + m;
          })()
        : 0;

      // 契約と実利用で status を決定
      const [ch, cm] = updatedItem.contractTime.split(":").map(Number);
      const contractedMin = ch * 60 + cm;
      const nextStatus: StatusCode =
        actualDuration > 0 &&
        contractedMin > 0 &&
        actualDuration < contractedMin
          ? "2"
          : "3";

      await client.models.VisitRecord.update(
        {
          id,
          actualLeaveTime: currentTime,
          actualDuration: actualDuration,
          status: nextStatus,
          reason: updatedItem.reason ?? undefined,
          updatedAt: now.toISOString(),
          updatedBy: "admin",
        },
        {
          authMode: "userPool",
        }
      );

      // ローカル状態の更新
      setAttendanceData((prev) =>
        prev.map((item: AttendanceData) =>
          item.id === id ? updatedItem : item
        )
      );

      toast(Message.IA000002, {
        description: `現在時刻: ${currentTime}`,
      });
    } catch (error) {
      console.error("退所時刻の更新に失敗:", error);
      toast(
        <div>
          <div className="font-bold text-destructive">エラー</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050013}
          </div>
        </div>,
        {
          icon: "❌",
          className: "bg-destructive text-destructive-foreground",
          duration: 5000,
        }
      );
    }
  };

  // 時間編集の開始
  const startEditing = (
    id: string,
    type: "arrival" | "departure",
    currentValue: string
  ) => {
    setEditingTime({ id, type, value: currentValue });
  };

  // 時間編集のキャンセル
  const cancelEditing = () => {
    setEditingTime(null);
  };

  /**
   * 来所・退所時刻の編集を保存し、DynamoDB に反映する。
   * @param id レコードID
   * @param type "arrival" または "departure"
   * @param newValue 編集後の時刻 (HH:mm)
   */

  const saveEditedTime = async (
    id: string,
    type: "arrival" | "departure",
    newValue: string
  ) => {
    // 時刻形式のバリデーション (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newValue)) {
      toast(
        <div>
          <div className="font-bold text-destructive">{Message.EF050014}</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050015}
          </div>
        </div>,
        {
          icon: "⏰",
          className: "bg-destructive text-destructive-foreground",
          duration: 5000,
        }
      );
      return;
    }

    const newDate = toDateTime(selectedDate, newValue);
    let updatedItem = {} as AttendanceData;

    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) => {
        if (item.id === id) {
          let temp: AttendanceData = { ...item };

          if (type === "arrival") {
            temp.arrivalTime = newDate;
            if (temp.departureTime) {
              temp = calculateUsageTime(temp, temp.departureTime);
            }
          } else {
            if (item.arrivalTime && newDate < item.arrivalTime) {
              toast(
                <div>
                  <div className="font-bold text-destructive">
                    {Message.EF050016}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Message.EF050017}
                  </div>
                </div>,
                {
                  icon: "⚠️",
                  className: "bg-destructive text-destructive-foreground",
                  duration: 5000,
                }
              );
              return item;
            }
            temp = calculateUsageTime(temp, newDate);
          }

          updatedItem = temp;
          return temp;
        }
        return item;
      })
    );

    setEditingTime(null);

    if (!updatedItem) return;

    try {
      // 時刻 "HH:mm" → 分 に変換する小ヘルパー（ファイル先頭か関数内でOK）
      const toMinutes = (hhmm?: string | null) => {
        if (!hhmm) return undefined;
        const [h, m] = hhmm.split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return undefined;
        return h * 60 + m;
      };

      // arrival/leave 操作の前で次ステータスを算出
      const actualMin = updatedItem.actualUsageTime
        ? toMinutes(updatedItem.actualUsageTime)
        : undefined;
      // 契約時間は contractTime("HH:mm") から算出（数値の contractedDuration を持っているならそれでもOK）
      const contractedMin = toMinutes(updatedItem.contractTime);

      const nextStatus: StatusCode =
        type === "arrival"
          ? "1" // 来所→利用中
          : actualMin != null &&
              contractedMin != null &&
              actualMin < contractedMin
            ? "2"
            : "3";
      // 退所→短時間 or 完了

      await client.models.VisitRecord.update(
        {
          id,
          ...(type === "arrival"
            ? { actualArrivalTime: format(newDate, "HH:mm") }
            : { actualLeaveTime: format(newDate, "HH:mm") }),
          actualDuration: updatedItem.actualUsageTime
            ? (() => {
                const [h, m] = updatedItem
                  .actualUsageTime!.split(":")
                  .map(Number);
                return h * 60 + m;
              })()
            : undefined,
          status: nextStatus,
          reason: updatedItem.reason ?? undefined,
          updatedAt: new Date().toISOString(),
          updatedBy: "admin",
        },
        {
          authMode: "userPool",
        }
      );

      toast(
        <div>
          <div className="font-semibold text-foreground">
            {type === "arrival" ? "来所" : "退所"}
            {Message.IA000005}
          </div>
          <div className="text-sm text-muted-foreground">
            新しい時刻: {newValue}
          </div>
        </div>,
        {
          icon: "✅",
          duration: 4000,
        }
      );
    } catch (error) {
      console.error("DynamoDB 更新失敗:", error);
      toast(
        <div>
          <div className="font-bold text-destructive">{Message.EF050027}</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050025}
          </div>
        </div>,
        {
          icon: "❌",
          className: "bg-destructive text-destructive-foreground",
          duration: 5000,
        }
      );
    }
  };

  // 備考編集の開始
  const startEditingNote = (id: string, currentValue: string | null) => {
    setEditingNote({ id, value: currentValue || "" });
  };

  // 備考の保存
  const saveNote = async (id: string, newValue: string) => {
    const trimmed = newValue.trim() === "" ? null : newValue.trim();

    // ローカル状態を更新
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) => {
        if (item.id === id) {
          return {
            ...item,
            note: trimmed,
          };
        }
        return item;
      })
    );

    setEditingNote(null);

    try {
      // データベースを更新
      await client.models.VisitRecord.update({
        id,
        note: trimmed,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      });

      toast(Message.IA000003, {
        description: trimmed || "（空欄）",
      });
    } catch (error) {
      console.error("備考の保存に失敗:", error);
      toast(
        <div>
          <div className="font-bold text-destructive">{Message.EF050019}</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050020}
          </div>
        </div>,
        {
          icon: "❌",
          duration: 5000,
          className: "bg-destructive text-destructive-foreground",
        }
      );
    }
  };

  // 理由の更新
  const updateReason = async (id: string, reason: string) => {
    const code = toReasonCode(reason);
    // ローカル状態の更新
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) => {
        if (item.id === id) {
          return {
            ...item,
            reason: code,
          };
        }
        return item;
      })
    );

    try {
      // DynamoDB の更新
      await client.models.VisitRecord.update(
        {
          id,
          reason: code,
          updatedAt: new Date().toISOString(),
          updatedBy: "admin",
        },
        {
          authMode: "userPool",
        }
      );

      toast(Message.IA000004, { description: REASON_LABEL[code] });
    } catch (error) {
      console.error("早退/超過理由の保存に失敗:", error);
      toast(
        <div>
          <div className="font-bold text-destructive">{Message.EF050021}</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050020}
          </div>
        </div>,
        {
          icon: "❌",
          className: "bg-destructive text-destructive-foreground",
          duration: 5000,
        }
      );
    }
  };

  /**
   * 分数を "HH:mm" 形式に変換するユーティリティ関数。
   * @param {number} minutes
   * @returns {string}
   */

  const convertMinutesToHHMM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  /**
   * 実利用時間（arrivalTime 〜 departureTime）を計算し、短時間利用かどうかも判定。
   * @param {AttendanceData} item 計算対象の1件データ
   * @param {Date} departureTime 退所時刻
   * @returns {AttendanceData} 実利用時間・退所時刻を反映したデータ
   */

  /**
   * 実利用時間を arrivalTime と departureTime から算出。
   * 契約利用時間と比較して短時間利用フラグも付与。
   *
   * @param item AttendanceData型の1件（来所済みであること）
   * @param departureTime 退所時刻
   * @returns 利用時間と短時間利用情報を含んだ更新済みAttendanceData
   */
  const calculateUsageTime = (
    item: AttendanceData,
    departureTime: Date
  ): AttendanceData => {
    if (!item.arrivalTime) {
      return {
        ...item,
        arrivalTime: null,
        departureTime,
        actualUsageTime: null,
        isShortUsage: false,
      };
    }

    // 同日前提：時分のみで差分
    const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();
    let diffMinutes = toMinutes(departureTime) - toMinutes(item.arrivalTime);
    if (diffMinutes < 0) diffMinutes = 0; // 念のためガード
    if (diffMinutes > 24 * 60) diffMinutes %= 24 * 60; // 念のためガード

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const actualUsageTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const [ch, cm] = item.contractTime.split(":").map(Number);
    const contractTotalMinutes = (ch || 0) * 60 + (cm || 0);
    const isShortUsage =
      contractTotalMinutes > 0 ? diffMinutes < contractTotalMinutes : false;

    return { ...item, departureTime, actualUsageTime, isShortUsage };
  };

  // 時刻をリセットする関数
  const resetTime = async (id: string, type: "arrival" | "departure") => {
    const now = new Date();
    const itemBefore = attendanceData.find((x) => x.id === id);
    const hadArrival = !!itemBefore?.arrivalTime;
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) => {
        if (item.id === id) {
          if (type === "arrival") {
            return {
              ...item,
              arrivalTime: null,
              departureTime: null,
              actualUsageTime: null,
              isShortUsage: false,
            };
          } else {
            return {
              ...item,
              departureTime: null,
              actualUsageTime: null,
              isShortUsage: false,
            };
          }
        }
        return item;
      })
    );

    setEditingTime(null);

    try {
      const now = new Date();

      await client.models.VisitRecord.update(
        {
          id,
          ...(type === "arrival"
            ? {
                actualArrivalTime: null,
                actualLeaveTime: null,
                actualDuration: null,
                status: "0",
              }
            : {
                actualLeaveTime: null,
                actualDuration: null,
                status: hadArrival ? "1" : "0", // ← 来所が残っていれば利用中
              }),
          reason: "0",
          updatedAt: now.toISOString(),
          updatedBy: "admin",
        },
        {
          authMode: "userPool",
        }
      );

      toast(
        <div>
          <div className="font-semibold text-foreground">
            {type === "arrival" ? "来所" : "退所"}
            {Message.EF050022}
          </div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050023}
          </div>
        </div>,
        {
          icon: "♻️",
          duration: 4000,
        }
      );
    } catch (error) {
      console.error("リセット時のDB更新失敗:", error);
      toast(
        <div>
          <div className="font-bold text-destructive">{Message.EF050024}</div>
          <div className="text-sm text-muted-foreground">
            {Message.EF050025}
          </div>
        </div>,
        {
          icon: "❌",
          className: "bg-destructive text-destructive-foreground",
          duration: 5000,
        }
      );
    }
  };

  // ソート関数
  const handleSort = (column: SortColumn) => {
    let direction: SortDirection = "asc";

    if (
      sortConfig &&
      sortConfig.column === column &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    setSortConfig({ column, direction });
  };

  const handleDeleteVisitRecord = async (row: AttendanceData) => {
    if (!window.confirm("この行を削除します。よろしいですか？")) return;
    try {
      await client.models.VisitRecord.delete(
        { id: row.id },
        { authMode: "userPool" }
      );
      // ローカルも即時反映（observeQuery でも追従）
      setAttendanceData((prev) => prev.filter((x) => x.id !== row.id));
    } catch (e) {
      console.error("削除失敗:", e);
      alert("削除に失敗しました。画面を更新して再度お試しください。");
    }
  };

  // ソートされたデータを取得
  const getSortedData = () => {
    if (!sortConfig) return attendanceData;

    return [...attendanceData].sort((a, b) => {
      const { column, direction } = sortConfig;
      const directionMultiplier = direction === "asc" ? 1 : -1;

      // 列ごとの比較ロジック
      switch (column) {
        case "userName":
          const aKey = (a.userNameKana ?? a.userName) || "";
          const bKey = (b.userNameKana ?? b.userName) || "";
          return jaCollator.compare(aKey, bKey) * directionMultiplier;

        case "scheduledTime": {
          const toMinutes = (time?: string | null) => {
            if (!time || !/^\d{2}:\d{2}$/.test(time)) return null; // 空や不正は末尾へ
            const [h, m] = time.split(":").map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            return h * 60 + m;
          };

          const am = toMinutes(a.scheduledTime);
          const bm = toMinutes(b.scheduledTime);

          if (am == null && bm == null) return 0;
          if (am == null) return directionMultiplier; // 空は末尾
          if (bm == null) return -directionMultiplier;

          return (am - bm) * directionMultiplier;
        }

        case "Badge": {
          const getStatusRank = (d: AttendanceData): number => {
            if (!d.arrivalTime) return 0; // 未来所
            if (!d.departureTime) return 1; // 利用中
            return d.isShortUsage ? 2 : 3; // 短時間 / 完了
          };
          const ra = getStatusRank(a);
          const rb = getStatusRank(b);
          if (ra !== rb) return (ra - rb) * directionMultiplier;

          // ① 同順位なら名前で安定ソート
          const aKey = (a.userNameKana ?? a.userName) || "";
          const bKey = (b.userNameKana ?? b.userName) || "";
          const nameCmp = jaCollator.compare(aKey, bKey);
          if (nameCmp !== 0) return nameCmp * directionMultiplier;

          // ② それでも同じなら来所予定で比較（空は末尾）
          const parseHHMM = (time?: string | null) => {
            if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
            const [h, m] = time.split(":").map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          };
          const ad = parseHHMM(a.scheduledTime),
            bd = parseHHMM(b.scheduledTime);
          if (ad === null && bd === null) return 0;
          if (ad === null) return directionMultiplier;
          if (bd === null) return -directionMultiplier;
          return (ad.getTime() - bd.getTime()) * directionMultiplier;
        }

        case "contractTime":
          // 契約時間を分に変換して比較
          const getContractMinutes = (time: string) => {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes;
          };
          return (
            (getContractMinutes(a.contractTime) -
              getContractMinutes(b.contractTime)) *
            directionMultiplier
          );
        case "arrivalTime":
          // nullの場合は最後に表示
          if (a.arrivalTime === null && b.arrivalTime === null) return 0;
          if (a.arrivalTime === null) return directionMultiplier;
          if (b.arrivalTime === null) return -directionMultiplier;
          return (
            compareTime(a.arrivalTime, b.arrivalTime) * directionMultiplier
          );
        case "departureTime": {
          const toMs = (d?: Date | null) => (d ? d.getTime() : null);
          const ta = toMs(a.departureTime);
          const tb = toMs(b.departureTime);

          // 1) どちらも退所時刻あり → 時刻で比較（方向はdirectionに従う）
          if (ta != null && tb != null) {
            const tDiff = (ta - tb) * directionMultiplier;
            if (tDiff !== 0) return tDiff;

            // 同時刻内の安定化（常に昇順で固定）
            const aKey = (a.userNameKana ?? a.userName) || "";
            const bKey = (b.userNameKana ?? b.userName) || "";
            const nameDiff = jaCollator.compare(aKey, bKey);
            if (nameDiff !== 0) return nameDiff;
            return a.id.localeCompare(b.id);
          }

          // 2) 片方だけ null → 常に null を末尾へ（昇順/降順に関係なく固定）
          if (ta == null && tb != null) return 1;
          if (ta != null && tb == null) return -1;

          // 3) どちらも null → 「利用中(来所あり)」→「未来所(来所なし)」で固定
          const nullRank = (d: AttendanceData) => (d.arrivalTime ? 0 : 1); // 0=利用中, 1=未来所
          const rDiff = nullRank(a) - nullRank(b);
          if (rDiff !== 0) return rDiff;

          // さらに同順位なら名前→idで安定化
          const aKey = (a.userNameKana ?? a.userName) || "";
          const bKey = (b.userNameKana ?? b.userName) || "";
          const nameDiff = jaCollator.compare(aKey, bKey);
          if (nameDiff !== 0) return nameDiff;
          return a.id.localeCompare(b.id);
        }

        case "actualUsageTime":
          const parseUsageMinutes = (time?: string | null) => {
            if (!time) return null;
            const [hours, minutes] = time.split(":").map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;
            return hours * 60 + minutes;
          };

          const aMinutes = parseUsageMinutes(a.actualUsageTime);
          const bMinutes = parseUsageMinutes(b.actualUsageTime);

          if (aMinutes == null && bMinutes == null) return 0;
          if (aMinutes == null) return directionMultiplier;
          if (bMinutes == null) return -directionMultiplier;

          return (aMinutes - bMinutes) * directionMultiplier;

        default:
          return 0;
      }
    });
  };

  // ソートアイコンを取得
  const getSortIcon = (column: SortColumn) => {
    if (!sortConfig || sortConfig.column !== column) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  // 利用状況に基づくステータスバッジを取得
  const getStatusBadge = (data: AttendanceData) => {
    const code =
      data.status ??
      deriveStatus(data.arrivalTime, data.departureTime, data.isShortUsage);
    switch (code) {
      case "0":
        return (
          <Badge variant="outline" className="bg-gray-100">
            未来所
          </Badge>
        );
      case "1":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            利用中
          </Badge>
        );
      case "2":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            短時間利用
          </Badge>
        );
      case "3":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            利用完了
          </Badge>
        );
      default:
        return null;
    }
  };

  // 児童名の表示用テキストを取得
  // const getUserNameDisplayText = (userName: string) => {
  //   const maxLength = 5;
  //   return userName.length > maxLength
  //     ? `${userName.substring(0, maxLength)}...`
  //     : userName;
  // };

  // 完全に表示したい場合：
  const getUserNameDisplayText = (userName: string) => userName;

  // 理由の表示用テキストを取得
  const getReasonDisplayText = (reason: ReasonCode | null) =>
    REASON_LABEL[reason ?? "0"];

  // ソート済みのデータを取得
  const sortedData = getSortedData();

  /**
   * 指定した日付に該当する VisitRecord モデルの変更をリアルタイムで購読する。
   *
   * Amplify Gen2 の Data Client を利用して、`visitDate` が選択中の日付と一致する
   * VisitRecord の変更（追加・更新・削除）を購読し、変更が発生したタイミングで
   * `fetchVisitRecords` を呼び出して再取得を行う。
   *
   * @function
   * @param {Date} selectedDate - フィルタ対象の日付（Asia/Tokyo タイムゾーン）
   * @param {() => void} fetchVisitRecords - データ更新時に呼び出すリロード関数
   * @returns {void}
   */
  useEffect(() => {
    const subscriptions = {
      unsubscribe: () => {},
    };

    const runSubscription = async () => {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken;

      // if (!token || token.isExpired) {
      //   console.warn(
      //     "未認証状態またはトークン期限切れのため observeQuery をスキップ"
      //   );
      //   return;
      // }

      const exp = token?.payload?.exp;
      const isExpired = typeof exp === "number" && Date.now() >= exp * 1000;

      if (!token || isExpired) {
        console.warn(
          "未認証状態またはトークン期限切れのため observeQuery をスキップ"
        );
        return;
      }

      const sub = client.models.VisitRecord.observeQuery({
        filter: {
          visitDate: {
            eq: formatInTimeZone(selectedDate, "Asia/Tokyo", "yyyy-MM-dd"),
          },
        },
        // @ts-expect-error: Amplify Gen2 の型に selection はまだ含まれていないが、実行時には問題なく動作する
        selection: (record) => [
          record.id(),
          record.visitDate(),
          record.actualArrivalTime(),
          record.actualLeaveTime(),
          record.actualDuration(),
          record.plannedArrivalTime(),
          record.contractedDuration(),
          record.status(),
          record.reason(),
          record.note(),
          record.recipientId(),
          record._version(),
        ],

        authMode: "userPool",
      }).subscribe({
        next: ({ items }: { items: any[] }) => {
          // recipientMap を使って氏名をJOIN
          const mapped = (items ?? []).map((r: any) => {
            const rec = r.recipientId
              ? recipientMap.get(r.recipientId)
              : undefined;
            return transformVisitRecord(r, rec);
          });
          if (!isEditingRef.current) setAttendanceData(mapped);
        },

        error: (err: unknown) => {
          console.error("VisitRecord サブスクリプションエラー:", err);
        },
      });

      subscriptions.unsubscribe = () => sub.unsubscribe();
    };

    runSubscription();

    return () => {
      subscriptions.unsubscribe();
    };
  }, [selectedDate, isEditing, recipientMap]);

  return (
    <div className="flex flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* メインコンテンツ */}
        <div className={cn("flex-1 overflow-auto transition-all duration-300")}>
          <Card className="mb-4 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-500 py-3 text-white">
              <CardTitle className="text-lg font-bold">通所実績管理</CardTitle>

              <div className="flex items-center rounded bg-white/20 overflow-hidden">
                <div
                  className="px-3 py-1 text-white cursor-text hover:bg-white/10 transition-colors text-sm"
                  onClick={() => setDatePickerOpen(true)}
                >
                  {formattedDate}
                </div>
                <Popover
                  open={datePickerOpen}
                  onOpenChange={(open) => {
                    setDatePickerOpen(open);
                    if (open) {
                      // 開いたら選択日を表示月にする
                      setCalendarMonth(selectedDate);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/30 rounded-none"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      locale={ja} // 日本語化
                      month={calendarMonth} // 表示中の月を state 管理
                      onMonthChange={setCalendarMonth}
                      formatters={{
                        formatCaption: (date) =>
                          format(date, "yyyy年M月", { locale: ja }),
                      }}
                      onSelect={(date) => {
                        if (date) {
                          console.log("選択された日付", date);
                          setSelectedDate(date);
                          setCalendarMonth(date);
                          setDatePickerOpen(false);
                        }
                      }}
                      // autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[850px]">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead
                          className="w-[80px] text-left cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("userName")}
                        >
                          <div className="flex items-center">
                            児童名
                            {getSortIcon("userName")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] text-center cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("scheduledTime")}
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            来所予定時刻
                            {getSortIcon("scheduledTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] text-center cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("contractTime")}
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            契約利用時間
                            {getSortIcon("contractTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] text-center cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("arrivalTime")}
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            来所時刻
                            {getSortIcon("arrivalTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] text-center cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("departureTime")}
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            退所時刻
                            {getSortIcon("departureTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] text-center cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("actualUsageTime")}
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            実利用時間
                            {getSortIcon("actualUsageTime")}
                          </div>
                        </TableHead>
                        <TableHead className="w-[80px] lg:w-[100px] text-center whitespace-nowrap">
                          早退/超過理由
                        </TableHead>
                        <TableHead className="w-[70px] lg:w-[120px] xl:w-[150px] text-center whitespace-nowrap">
                          備考
                        </TableHead>
                        <TableHead
                          className="w-[90px] text-center cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("Badge")}
                        >
                          ステータス
                          {getSortIcon("Badge")}
                        </TableHead>
                        <TableHead className="w-[60px] text-center">
                          削除
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {sortedData.map((data, index) => (
                          <motion.tr
                            key={data.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`border-b ${index % 2 === 1 ? "bg-blue-50/30" : ""} hover:bg-gray-50`}
                          >
                            <TableCell className="whitespace-nowrap py-2 text-left">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-default">
                                      {getUserNameDisplayText(data.userName)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{data.userName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              {/* {data.scheduledTime} */}
                              <span className="font-mono tabular-nums">
                                {data.scheduledTime}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              {ENABLE_CONTRACT_EDIT ? (
                                editingContract?.id === data.id ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      value={editingContract.value}
                                      onChange={(e) =>
                                        setEditingContract({
                                          id: data.id,
                                          value: e.target.value,
                                        })
                                      }
                                      onBlur={(e) =>
                                        setEditingContract({
                                          id: data.id,
                                          value: normalizeToHHmm(
                                            e.target.value
                                          ),
                                        })
                                      }
                                      className="w-20 text-center text-sm"
                                      placeholder="HH:mm"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                      onClick={() =>
                                        saveContractTime(
                                          data.id,
                                          editingContract.value
                                        )
                                      }
                                      title="保存"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                      onClick={() => setEditingContract(null)}
                                      title="キャンセル"
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="group flex items-center justify-center">
                                    <span className="font-medium">
                                      {data.contractTime || "-"}
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 ml-2"
                                      onClick={() =>
                                        setEditingContract({
                                          id: data.id,
                                          value: data.contractTime || "",
                                        })
                                      }
                                      title="契約利用時間を編集"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <span>{data.contractTime || "-"}</span>
                              )}
                            </TableCell>

                            <TableCell className="whitespace-nowrap py-2 text-center">
                              {data.arrivalTime ? (
                                <div className="group flex items-center justify-center gap-2">
                                  {editingTime &&
                                  editingTime.id === data.id &&
                                  editingTime.type === "arrival" ? (
                                    <div className="flex items-center justify-center gap-1 mx-auto">
                                      <Input
                                        type="text"
                                        value={editingTime.value}
                                        onChange={(e) =>
                                          setEditingTime({
                                            ...editingTime,
                                            value: e.target.value,
                                          })
                                        }
                                        onBlur={() => {
                                          const normalized = normalizeTimeInput(
                                            editingTime.value
                                          );
                                          if (normalized) {
                                            setEditingTime((prev) => ({
                                              ...prev!,
                                              value: normalized,
                                            }));
                                          }
                                          setEditing(false);
                                        }} //編集終了
                                        onFocus={() => setEditing(true)} //編集開始
                                        className="w-20 text-sm text-center"
                                        placeholder="HH:mm"
                                      />

                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                        onClick={() =>
                                          saveEditedTime(
                                            data.id,
                                            "arrival",
                                            editingTime.value
                                          )
                                        }
                                        title="保存"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
                                        onClick={() =>
                                          resetTime(data.id, "arrival")
                                        }
                                        title="時刻をリセット"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        onClick={cancelEditing}
                                        title="キャンセル"
                                      >
                                        <XIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="group grid grid-cols-[1.5rem_auto_1.5rem] items-center w-full">
                                      <span aria-hidden />
                                      <span className="justify-self-center inline-block w-14 text-center font-mono tabular-nums font-medium text-gray-700">
                                        {formatTimeJST(data.arrivalTime)}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="justify-self-end h-6 w-6 rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 ml-2"
                                        onClick={() =>
                                          startEditing(
                                            data.id,
                                            "arrival",
                                            formatTimeJST(data.arrivalTime)!
                                          )
                                        }
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Button
                                    size="sm"
                                    onClick={() => handleArrival(data.id)}
                                    className="bg-blue-500 hover:bg-blue-600 px-2 h-7 text-xs"
                                  >
                                    来所
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              {data.departureTime ? (
                                <div className="group flex items-center justify-center gap-2">
                                  {editingTime &&
                                  editingTime.id === data.id &&
                                  editingTime.type === "departure" ? (
                                    <div className="flex items-center justify-center gap-1 mx-auto">
                                      <Input
                                        type="text"
                                        value={editingTime.value}
                                        onChange={(e) =>
                                          setEditingTime({
                                            ...editingTime,
                                            value: e.target.value,
                                          })
                                        }
                                        onFocus={() => setEditing(true)} // 編集開始
                                        onBlur={(e) => {
                                          const rawValue = e.target.value;
                                          const formated =
                                            formatToHHMM(rawValue);
                                          setEditingTime({
                                            ...editingTime,
                                            value: formated,
                                          });
                                          setEditing(false); // 編集終了
                                        }}
                                        className="w-20 text-sm text-center"
                                        placeholder="HH:mm"
                                      />

                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                        onClick={() =>
                                          saveEditedTime(
                                            data.id,
                                            "departure",
                                            editingTime.value
                                          )
                                        }
                                        title="保存"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
                                        onClick={() =>
                                          resetTime(data.id, "departure")
                                        }
                                        title="時刻をリセット"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        onClick={cancelEditing}
                                        title="キャンセル"
                                      >
                                        <XIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="group grid grid-cols-[1.5rem_auto_1.5rem] items-center w-full">
                                      <span aria-hidden />
                                      <span className="justify-self-center inline-block w-14 text-center font-mono tabular-nums font-medium text-gray-700">
                                        {formatTimeJST(data.departureTime)}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="justify-self-end h-6 w-6 rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 ml-2"
                                        onClick={() =>
                                          startEditing(
                                            data.id,
                                            "departure",
                                            formatTimeJST(data.departureTime)
                                          )
                                        }
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : data.arrivalTime ? (
                                <div className="flex justify-center">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeparture(data.id)}
                                    className="bg-blue-500 hover:bg-blue-600 px-2 h-7 text-xs"
                                  >
                                    退所
                                  </Button>
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              {data.actualUsageTime && (
                                <span
                                  className={`${data.isShortUsage ? "text-red-500" : "text-gray-700"} font-mono tabular-nums font-medium`}
                                >
                                  {data.actualUsageTime}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <ReasonSelect
                                        value={data.reason}
                                        onChange={(v) =>
                                          updateReason(data.id, v)
                                        }
                                        onFocus={() => setEditing(true)}
                                        onBlur={() => setEditing(false)}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{getReasonDisplayText(data.reason)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>

                            <TableCell className="whitespace-nowrap py-2 text-left">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-full max-w-[65px] lg:max-w-[110px] xl:max-w-[140px] flex items-center justify-start px-2 text-left text-gray-600 hover:bg-gray-100 text-xs mx-auto"
                                onClick={() =>
                                  startEditingNote(data.id, data.note)
                                }
                              >
                                {data.note ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {screenWidth === null ? (
                                          ""
                                        ) : (
                                          <span className="truncate">
                                            {data.note!.length >
                                            (screenWidth < 1280 ? 10 : 20)
                                              ? `${data.note!.substring(0, screenWidth < 1280 ? 10 : 20)}...`
                                              : data.note}
                                          </span>
                                        )}
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{data.note}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </Button>

                              <NoteDialog
                                open={
                                  editingNote !== null &&
                                  editingNote.id === data.id
                                }
                                userName={data.userName}
                                value={editingNote?.value || ""}
                                /* 編集内容の反映 */
                                onChange={(v) =>
                                  setEditingNote({ id: data.id, value: v })
                                }
                                /* 閉じる・保存 */
                                onClose={() => setEditingNote(null)}
                                onSave={() =>
                                  saveNote(data.id, editingNote!.value)
                                }
                                onFocus={() => setEditing(true)}
                                onBlur={() => setEditing(false)}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              {getStatusBadge(data)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              <button
                                className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-red-50"
                                title="この行を削除"
                                aria-label="この行を削除"
                                onClick={() => handleDeleteVisitRecord(data)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* トースト通知 */}
      {/* <Toaster /> */}
    </div>
  );
}
