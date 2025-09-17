/**
 * @file 通所実績管理画面のメインコンポーネント
 * @description DynamoDB（VisitRecord）からの実績取得・編集・表示を行うUI実装
 * @module AttendanceManagement
 */

//src/components/attendance-management.tsx
"use client";

import { fetchAuthSession } from "@aws-amplify/auth";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowUp, ArrowDown } from "lucide-react";

import NoteDialog from "@/components/attendance/note-dialog";

import { Card, CardContent } from "@/components/ui/card";

import { useVisitRecords } from "@/hooks/use-visit-records";
import { useAttendanceActions } from "@/hooks/use-attendance-actions";
import DateToolbar from "@/components/attendance/date-toolbar";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import type {
  AttendanceData,
  StatusCode,
  ReasonCode,
} from "@/types/attendance";
import { reasonText, toReasonCode } from "@/types/attendance";
import { successToast, errorToast } from "@/lib/ui-toast";
import { parseTimeInJST, calcStatus } from "@/lib/utils";
import { diffSameDay, minutesToHHmm } from "@/lib/time-utils";

import {
  sortAttendance,
  type SortColumn,
  type SortDirection,
} from "@/lib/attendance-sorting";
import { useAttendanceEditing } from "@/hooks/use-attendance-editing";
import AttendanceTable from "@/components/attendance/attendance-table";
import type { RowActions } from "@/components/attendance/attendance-row";

// ソート用の型定義

export type SortConfig = { column: SortColumn; direction: "asc" | "desc" };

const client = generateClient<Schema>({ authMode: "userPool" });

// HH:mm → 2000-01-01 固定日の Date、パース失敗は null に寄せる
const toFixedDateOrNull = (hhmm?: string | null): Date | null =>
  hhmm ? (parseTimeInJST("2000-01-01", hhmm) ?? null) : null;

// 理由の表示は共通ヘルパに統一
const getReasonDisplayText = (reason: ReasonCode | null) => reasonText(reason);

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

// 変換ユーティリティ（非async）
const transformVisitRecord = (record: any, rec?: any) => {
  const userName = rec
    ? `${rec.lastName ?? ""}${rec.firstName ?? ""}`
    : "未設定";
  const userNameKana =
    rec && (rec.lastNameKana || rec.firstNameKana)
      ? `${rec.lastNameKana ?? ""}${rec.firstNameKana ?? ""}`
      : undefined;

  const arrivalTime: Date | null = toFixedDateOrNull(record.actualArrivalTime);
  const departureTime: Date | null = toFixedDateOrNull(record.actualLeaveTime);

  const contractTime = record.contractedDuration
    ? `${Math.floor(record.contractedDuration / 60)}:${`${record.contractedDuration % 60}`.padStart(2, "0")}`
    : "";

  const usedMins = diffSameDay(
    record.actualArrivalTime,
    record.actualLeaveTime
  ); // 分 or null
  const actualUsageTime = usedMins == null ? null : minutesToHHmm(usedMins);

  const isShortUsage =
    typeof record.contractedDuration === "number" &&
    typeof usedMins === "number"
      ? usedMins < record.contractedDuration
      : false;

  const status: StatusCode = deriveStatus(
    arrivalTime,
    departureTime,
    isShortUsage
  );

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

  // 備考ダイアログの状態
  const [noteDlg, setNoteDlg] = useState<{
    open: boolean;
    id: string;
    userName: string;
    value: string;
  }>({ open: false, id: "", userName: "", value: "" });

  // 行から「編集したい」が来たら開く（Table に渡す）
  const onEditNote = (id: string, current: string | null) => {
    const u = sortedData.find((x) => x.id === id)?.userName ?? "";
    setNoteDlg({ open: true, id, userName: u, value: current ?? "" });
  };

  const [currentTime, setCurrentTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { editing, startEditing, cancelEditing, setValue } =
    useAttendanceEditing();
  const [editingNote, setEditingNote] = useState<{
    id: string;
    value: string;
  } | null>(null);

  const [sort, setSort] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({
    column: "userName",
    direction: "asc",
  });
  const onSort = (c: SortColumn) =>
    setSort((prev) =>
      prev.column === c
        ? { column: c, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column: c, direction: "asc" }
    );

  const {
    data: attendanceData,
    refetch,
    setData: setAttendanceData,
  } = useVisitRecords(selectedDate, client);

  const actions = useAttendanceActions({
    client,
    setAttendanceData,
    refetch, // 失敗時の巻き戻し用
    currentUserName: "admin",
  });

  const handleDeleteVisitRecord = async (row: AttendanceData) => {
    if (!window.confirm("この行を削除します。よろしいですか？")) return;
    try {
      await client.models.VisitRecord.delete(
        { id: row.id },
        { authMode: "userPool" }
      );
      setAttendanceData((prev) => prev.filter((x) => x.id !== row.id));
      successToast("削除しました");
    } catch (e) {
      console.error("削除失敗:", e);
      errorToast();
    }
  };

  // ★ RowActions 形に合わせて“名前を変えて”束ねる
  const tableActions: RowActions = {
    handleArrival: actions.handleArrival,
    handleDeparture: actions.handleDeparture,
    saveEditedTime: actions.saveEditedTime,
    resetTime: actions.resetTime,

    // 名前違いを合わせる（三つ）
    handleSaveContract: actions.saveContractTime, // ← saveContractTime を利用
    handleSaveReason: (id, code) => actions.updateReason(id, code), // ← updateReason をラップ
    handleSaveNote: (id, note) => actions.saveNote(id, note), // ← saveNote をラップ
    deleteRow: handleDeleteVisitRecord,
  };

  const sortedData = useMemo(
    () =>
      sortAttendance<AttendanceData>(
        attendanceData,
        sort.column,
        sort.direction
      ),
    [attendanceData, sort]
  );

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

        // ★ ここで Date|null を確定（undefined は null に寄せる）
        const arrivalTime: Date | null = toFixedDateOrNull(r.actualArrivalTime);
        const departureTime: Date | null = toFixedDateOrNull(r.actualLeaveTime);

        // 実利用（分→HH:mm）も先に型付きで計算
        const usedMins: number | null = diffSameDay(
          r.actualArrivalTime,
          r.actualLeaveTime
        );
        const actualUsageTime: string | null =
          usedMins == null ? null : minutesToHHmm(usedMins);

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

          // ★ visitDate を使わず、固定日の Date にする
          arrivalTime,
          departureTime,

          // ★ 実利用は HH:mm 同士で計算（同日扱い）
          actualUsageTime,
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
  }, [recipientMap, selectedDate]); // recipientMap に依存（受給者マスタ取得完了後に開始）

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

  /**
   * 来所・退所時刻の編集を保存し、DynamoDB に反映する。
   * @param id レコードID
   * @param type "arrival" または "departure"
   * @param newValue 編集後の時刻 (HH:mm)
   */

  // 備考編集の開始
  const startEditingNote = (id: string, currentValue: string | null) => {
    setEditingNote({ id, value: currentValue || "" });
  };

  // ソートアイコンを取得
  const getSortIcon = (column: SortColumn) => {
    if (!sort || sort.column !== column) {
      return null;
    }
    return sort.direction === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
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
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">
      <div className="flex flex-1 min-h-0">
        {/* メインコンテンツ */}
        <div
          className={cn(
            "flex-1 min-h-0 min-w-0 transition-all duration-300 pb-24"
          )}
        >
          <div className="mx-auto w-full max-w-none px-3 md:px-4">
            <Card className="mb-4 overflow-hidden rounded-xl shadow-sm">
              <DateToolbar
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(d)}
                calendarMonth={calendarMonth}
                setCalendarMonth={setCalendarMonth}
                open={datePickerOpen}
                setOpen={setDatePickerOpen}
                title="通所実績管理"
              />
            </Card>

            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-0">
                <AttendanceTable
                  rows={sortedData}
                  sort={sort}
                  onSort={onSort}
                  editing={editing}
                  onStartEdit={startEditing}
                  onCancelEdit={cancelEditing}
                  actions={tableActions}
                  onChangeEditValue={setValue}
                  onEditNote={onEditNote}
                  onFocusEditing={() => setEditing(true)}
                  onBlurEditing={() => setEditing(false)}
                />
              </CardContent>
            </Card>
          </div>
          <NoteDialog
            open={noteDlg.open}
            userName={noteDlg.userName}
            value={noteDlg.value}
            onChange={(v) => setNoteDlg((prev) => ({ ...prev, value: v }))}
            onClose={() => setNoteDlg((prev) => ({ ...prev, open: false }))}
            onSave={async () => {
              const { id, value } = noteDlg;
              const ok = await tableActions.handleSaveNote(id, value);

              setNoteDlg((prev) => ({ ...prev, open: false }));
            }}
            onFocus={() => setEditing(true)} // 入力中は購読更新の反映を止めるなら
            onBlur={() => setEditing(false)}
          />
        </div>
      </div>
    </div>
  );
}
