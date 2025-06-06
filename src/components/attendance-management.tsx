/**
 * @file 通所実績管理画面のメインコンポーネント
 * @description DynamoDB（VisitRecord）からの実績取得・編集・表示を行うUI実装
 * @module AttendanceManagement
 */

//src/componets/attendance-management.tsx
"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ja } from "date-fns/locale";
import { formatTimeJST } from "@/lib/utils";
import { LogOut, Calendar, Edit2, Check, XIcon, Trash2, ArrowUp, ArrowDown, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
// import { Toaster } from "@/components/ui/toaster"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

import { Amplify } from "aws-amplify";
import config from "../../amplify_outputs.json";

Amplify.configure(config);


const client = generateClient<Schema>();


/**
 * 通所実績データを表す型。
 * 各児童に対して、当日の来所・退所・利用状況などを表現する。
 */
type AttendanceData = {
  id: string
  userName: string
  scheduledTime: string
  contractTime: string
  arrivalTime: Date | null
  departureTime: Date | null
  actualUsageTime: string | null
  isShortUsage: boolean
  reason: string | null
  note: string | null
}

// ソート用の型定義
type SortColumn = "userName" | "scheduledTime" | "contractTime" | "arrivalTime" | "departureTime" | "actualUsageTime"
type SortDirection = "asc" | "desc"


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
  // UIの開閉状態（サイドバー用）
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // 現在の画面幅（レスポンシブ表示制御用）
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  // 開発時の表示確認用トースト（本番では削除）
  useEffect(() => {
    toast({ title: "テスト", description: "表示されていればOKです" })
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [editingTime, setEditingTime] = useState<{ id: string; type: "arrival" | "departure"; value: string } | null>(
    null,
  )
  const [editingNote, setEditingNote] = useState<{ id: string; value: string } | null>(null)
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection } | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);

  // State: 児童マスタと前回取得データのキャッシュ
  const [childMap, setChildMap] = useState<Map<string, string>>(new Map());
  const [lastFetchedJson, setLastFetchedJson] = useState<string>("");

  useEffect(() => {
    const fetchChildMaster = async () => {
      try {
        const { data: children } = await client.models.Child.list();
        const map = new Map(
          children
            .filter(child => child.childId != null)
            .map(child => [child.childId!, `${child.lastName}${child.firstName}`])
        );
        setChildMap(map);
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
   * 同一データはスキップして再描画を抑制。
   */
  const fetchVisitRecords = async () => {

    try {
      const { data: records } = await client.models.VisitRecord.list({
        filter: {
          visitDate: {
            eq: formatInTimeZone(selectedDate, "Asia/Tokyo", "yyyy-MM-dd"),
          },
        },
      });

      // 変更検知用の JSON 化f
      const currentJson = JSON.stringify(records);
      if (currentJson === lastFetchedJson) return;

      setLastFetchedJson(currentJson);

      const mapped: AttendanceData[] = records.map((record): AttendanceData => {
        const visitDate = new Date(record.visitDate!);

        return {
          id: record.id,
          userName:
            record.childId && childMap.has(record.childId)
              ? childMap.get(record.childId)!
              : "未設定",
          scheduledTime: record.plannedArrivalTime ?? "",
          contractTime:
            record.contractedDuration != null
              ? convertMinutesToHHMM(record.contractedDuration)
              : "--:--",
          arrivalTime: record.actualArrivalTime
            ? toDateTime(visitDate, record.actualArrivalTime)
            : null,
          departureTime: record.actualLeaveTime
            ? toDateTime(visitDate, record.actualLeaveTime)
            : null,
          actualUsageTime: record.actualDuration
            ? convertMinutesToHHMM(record.actualDuration)
            : null,
          isShortUsage: false,
          reason: record.earlyLeaveReasonCode || null,
          note: record.remarks || null,
        };
      });


      setAttendanceData(mapped);
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

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchVisitRecords();
      }
    }, 10000); // 10秒

    return () => clearInterval(intervalId);
  }, [childMap, selectedDate]); // childMap に依存（児童マスタ取得完了後に開始）

  // 現在の日付
  const formattedDate = format(selectedDate, "yyyy年MM月dd日(E)", { locale: ja })

  // 現在時刻の更新
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      setCurrentTime(format(now, "HH:mm:ss"))
    }

    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // 来所ボタンのハンドラー
  const handleArrival = async (id: string) => {
    const now = new Date();
    // const currentTime = format(now, "HH:mm");

    // ローカルUIの更新
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) =>
        item.id === id ? { ...item, arrivalTime: now } : item
      )
    );

    try {
      // DynamoDBの更新
      await client.models.VisitRecord.update({
        id: id,
        actualArrivalTime: currentTime,
        updatedAt: now.toISOString(),
        updatedBy: "admin", // 実際のログインユーザー名に差し替え可
      });

      toast({
        title: "来所を記録しました",
        description: `現在時刻: ${currentTime}`,
      });
    } catch (error) {
      console.error("来所時刻の更新に失敗しました:", error);

      toast({
        variant: "destructive",
        title: "エラー",
        description: "DynamoDBへの更新に失敗しました",
      });

      // 必要であればここで setAttendanceData をロールバックしてもよい
    }
  };


  // 退所ボタンのハンドラー
  const handleDeparture = async (id: string) => {
    const now = new Date();

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

      await client.models.VisitRecord.update({
        id,
        actualLeaveTime: currentTime,
        actualDuration: actualDuration,
        earlyLeaveReasonCode: updatedItem.reason ?? undefined,
        updatedAt: now.toISOString(),
        updatedBy: "admin",
      });

      // ローカル状態の更新
      setAttendanceData((prev) =>
        prev.map((item: AttendanceData) => (item.id === id ? updatedItem : item))
      );

      toast({
        title: "退所を記録しました",
        description: `現在時刻: ${currentTime}`,
      });
    } catch (error) {
      console.error("退所時刻の更新に失敗:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "DynamoDBへの退所記録に失敗しました",
      });
    }
  };

  // 時間編集の開始
  const startEditing = (id: string, type: "arrival" | "departure", currentValue: string) => {
    setEditingTime({ id, type, value: currentValue })
  }

  // 時間編集のキャンセル
  const cancelEditing = () => {
    setEditingTime(null)
  }

  /**
 * 来所・退所時刻の編集を保存し、DynamoDB に反映する。
 * @param id レコードID
 * @param type "arrival" または "departure"
 * @param newValue 編集後の時刻 (HH:mm)
 */

  const saveEditedTime = async (id: string, type: "arrival" | "departure", newValue: string) => {
    // 時刻形式のバリデーション (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newValue)) {
      toast({
        variant: "destructive",
        title: "無効な時刻形式です",
        description: "時刻は HH:mm 形式で入力してください (例: 09:30)",
      });
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
              toast({
                variant: "destructive",
                title: "無効な退所時刻です",
                description: "退所時刻は来所時刻より後である必要があります",
              });
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
      await client.models.VisitRecord.update({
        id,
        ...(type === "arrival"
          ? { actualArrivalTime: format(newDate, "HH:mm") }
          : { actualLeaveTime: format(newDate, "HH:mm") }),
        actualDuration: updatedItem.actualUsageTime
          ? (() => {
            const [h, m] = updatedItem.actualUsageTime!.split(":").map(Number);
            return h * 60 + m;
          })()
          : undefined,
        earlyLeaveReasonCode: updatedItem.reason ?? undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      });

      toast({
        title: `${type === "arrival" ? "来所" : "退所"}時刻を更新しました`,
        description: `新しい時刻: ${newValue}`,
      });
    } catch (error) {
      console.error("DynamoDB 更新失敗:", error);
      toast({
        variant: "destructive",
        title: "更新エラー",
        description: "DynamoDBへの反映に失敗しました",
      });
    }
  };


  // 備考編集の開始
  const startEditingNote = (id: string, currentValue: string | null) => {
    setEditingNote({ id, value: currentValue || "" })
  }

  // 備考の保存
  const saveNote = (id: string, newValue: string) => {
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) => {
        if (item.id === id) {
          return {
            ...item,
            note: newValue.trim() === "" ? null : newValue.trim(),
          }
        }
        return item
      }),
    )

    setEditingNote(null)

    toast({
      title: "備考を更新しました",
    })
  }

  // 理由の更新
  const updateReason = (id: string, reason: string) => {
    setAttendanceData((prev) =>
      prev.map((item: AttendanceData) => {
        if (item.id === id) {
          return {
            ...item,
            reason,
          }
        }
        return item
      }),
    )

    toast({
      title: "早退/超過理由を更新しました",
    })
  }

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


  // 時刻を比較する関数 (a < b なら負、a > b なら正、a = b なら 0)
  /** 
* 2つのDateオブジェクトを比較する。
* @param a 比較対象の日時1
* @param b 比較対象の日時2
* @returns a < b: 負数, a > b: 正数, 同一: 0
*/
  const compareTime = (a: Date, b: Date): number => {
    return a.getTime() - b.getTime();
  }

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
  const calculateUsageTime = (item: AttendanceData, departureTime: Date): AttendanceData => {
    if (!item.arrivalTime) {
      return {
        ...item,
        arrivalTime: null,
        departureTime,
        actualUsageTime: null,
        isShortUsage: false,
      };
    }

    // 差分（分）を計算
    const diffMilliseconds = departureTime.getTime() - item.arrivalTime.getTime();
    const diffMinutes = Math.floor(diffMilliseconds / 60000);

    // HH:mm 形式の文字列に変換
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const actualUsageTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // 契約時間を分に変換
    const [contractHours, contractMinutes] = item.contractTime.split(":").map(Number);
    const contractTotalMinutes = contractHours * 60 + contractMinutes;

    // 契約より短いかどうかを判定
    const isShortUsage = diffMinutes < contractTotalMinutes;

    return {
      ...item,
      departureTime,
      actualUsageTime,
      isShortUsage,
    };
  };


  // 時刻をリセットする関数
  const resetTime = async (id: string, type: "arrival" | "departure") => {
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
            }
          } else {
            return {
              ...item,
              departureTime: null,
              actualUsageTime: null,
              isShortUsage: false,
            }
          }
        }
        return item
      })
    );

    setEditingTime(null);

    try {
      const now = new Date();

      await client.models.VisitRecord.update({
        id,
        ...(type === "arrival"
          ? { actualArrivalTime: null, actualLeaveTime: null, actualDuration: null }
          : { actualLeaveTime: null, actualDuration: null }),
        earlyLeaveReasonCode: undefined,
        updatedAt: now.toISOString(),
        updatedBy: "admin",
      });

      toast({
        title: `${type === "arrival" ? "来所" : "退所"}時刻をリセットしました`,
        description: "DynamoDB にも反映されました",
      });
    } catch (error) {
      console.error("リセット時のDB更新失敗:", error);
      toast({
        variant: "destructive",
        title: "リセットエラー",
        description: "DynamoDBへのリセット反映に失敗しました",
      });
    }
  };


  // ソート関数
  const handleSort = (column: SortColumn) => {
    let direction: SortDirection = "asc"

    if (sortConfig && sortConfig.column === column && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ column, direction })
  }

  // ソートされたデータを取得
  const getSortedData = () => {
    if (!sortConfig) return attendanceData

    return [...attendanceData].sort((a, b) => {
      const { column, direction } = sortConfig
      const directionMultiplier = direction === "asc" ? 1 : -1

      // 列ごとの比較ロジック
      switch (column) {
        case "userName":
          return a.userName.localeCompare(b.userName) * directionMultiplier
        case "scheduledTime": {
          const baseDate = new Date(); // 日付部分は何でもよい
          const parseHHMM = (timeStr: string) => {
            const [h, m] = timeStr.split(":").map(Number);
            const d = new Date(baseDate);
            d.setHours(h, m, 0, 0);
            return d;
          };
          return (
            compareTime(parseHHMM(a.scheduledTime), parseHHMM(b.scheduledTime)) *
            directionMultiplier
          );
        }

        case "contractTime":
          // 契約時間を分に変換して比較
          const getContractMinutes = (time: string) => {
            const [hours, minutes] = time.split(":").map(Number)
            return hours * 60 + minutes
          }
          return (getContractMinutes(a.contractTime) - getContractMinutes(b.contractTime)) * directionMultiplier
        case "arrivalTime":
          // nullの場合は最後に表示
          if (a.arrivalTime === null && b.arrivalTime === null) return 0
          if (a.arrivalTime === null) return directionMultiplier
          if (b.arrivalTime === null) return -directionMultiplier
          return compareTime(a.arrivalTime, b.arrivalTime) * directionMultiplier
        case "departureTime":
          // nullの場合は最後に表示
          if (a.departureTime === null && b.departureTime === null) return 0
          if (a.departureTime === null) return directionMultiplier
          if (b.departureTime === null) return -directionMultiplier
          return compareTime(a.departureTime, b.departureTime) * directionMultiplier
        case "actualUsageTime":
          // nullの場合は最後に表示
          if (a.actualUsageTime === null && b.actualUsageTime === null) return 0
          if (a.actualUsageTime === null) return directionMultiplier
          if (b.actualUsageTime === null) return -directionMultiplier

          // 実利用時間を分に変換して比較
          const getUsageMinutes = (time: string) => {
            const [hours, minutes] = time.split(":").map(Number)
            return hours * 60 + minutes
          }
          return (getUsageMinutes(a.actualUsageTime) - getUsageMinutes(b.actualUsageTime)) * directionMultiplier
        default:
          return 0
      }
    })
  }

  // ソートアイコンを取得
  const getSortIcon = (column: SortColumn) => {
    if (!sortConfig || sortConfig.column !== column) {
      return null
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    )
  }

  // 利用状況に基づくステータスバッジを取得
  const getStatusBadge = (data: AttendanceData) => {
    if (!data.arrivalTime) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          未来所
        </Badge>
      )
    } else if (!data.departureTime) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          利用中
        </Badge>
      )
    } else if (data.isShortUsage) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          短時間利用
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          利用完了
        </Badge>
      )
    }
  }

  // // 備考の表示用テキストを取得
  // const getNoteDisplayText = (note: string | null) => {
  //   if (!note) return null
  //   // 画面サイズに応じて表示文字数を変更（小さい画面では10文字、大きい画面では最大20文字）
  //   const screenWidth = typeof window !== "undefined" ? window.innerWidth : 0
  //   const maxLength = screenWidth < 1280 ? 10 : 20
  //   return note.length > maxLength ? `${note.substring(0, maxLength)}...` : note
  // }

  // 児童名の表示用テキストを取得
  const getUserNameDisplayText = (userName: string) => {
    const maxLength = 5
    return userName.length > maxLength ? `${userName.substring(0, maxLength)}...` : userName
  }

  // 理由の表示用テキストを取得
  const getReasonDisplayText = (reason: string | null) => {
    if (!reason || reason === "未選択") return "未選択"
    const maxLength = 3
    return reason.length > maxLength ? `${reason.substring(0, maxLength)}...` : reason
  }

  // ソート済みのデータを取得
  const sortedData = getSortedData()

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="メニューを開く"
            className="mr-2 rounded-full hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">プロジェクト名</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="mr-4 text-sm font-medium text-gray-700">真　屋太郎</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLogoutDialogOpen(true)}
              aria-label="ログアウト"
              className="rounded-full hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* サイドメニュー */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* メインコンテンツ */}
        <main
          className={`flex-1 overflow-auto p-4 transition-all duration-300 ${sidebarOpen ? "" : "container mx-auto px-2 md:px-4"
            }`}
        >
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
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/30 rounded-none">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          console.log("選択された日付", date)
                          setSelectedDate(date)
                          setDatePickerOpen(false)
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
                          className="w-[80px] cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("userName")}
                        >
                          <div className="flex items-center">
                            児童名
                            {getSortIcon("userName")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("scheduledTime")}
                        >
                          <div className="flex items-center">
                            来所予定時刻
                            {getSortIcon("scheduledTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("contractTime")}
                        >
                          <div className="flex items-center">
                            契約利用時間
                            {getSortIcon("contractTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("arrivalTime")}
                        >
                          <div className="flex items-center">
                            来所時刻
                            {getSortIcon("arrivalTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("departureTime")}
                        >
                          <div className="flex items-center">
                            退所時刻
                            {getSortIcon("departureTime")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="w-[90px] cursor-pointer whitespace-nowrap hover:bg-gray-100"
                          onClick={() => handleSort("actualUsageTime")}
                        >
                          <div className="flex items-center">
                            実利用時間
                            {getSortIcon("actualUsageTime")}
                          </div>
                        </TableHead>
                        <TableHead className="w-[80px] lg:w-[100px] whitespace-nowrap">早退/超過理由</TableHead>
                        <TableHead className="w-[70px] lg:w-[120px] xl:w-[150px] whitespace-nowrap">備考</TableHead>
                        <TableHead className="w-[90px] whitespace-nowrap">ステータス</TableHead>
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
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-default">{getUserNameDisplayText(data.userName)}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{data.userName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">{data.scheduledTime}</TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">{data.contractTime}</TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">
                              {data.arrivalTime ? (
                                <div className="group flex items-center justify-center gap-2">
                                  {editingTime && editingTime.id === data.id && editingTime.type === "arrival" ? (
                                    <div className="flex items-center justify-center gap-1 mx-auto">
                                      <Input
                                        type="text"
                                        value={editingTime.value}
                                        onChange={(e) => setEditingTime({ ...editingTime, value: e.target.value })}
                                        className="w-20 text-sm text-center"
                                        placeholder="HH:mm"
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => saveEditedTime(data.id, "arrival", editingTime.value)}
                                        title="保存"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => resetTime(data.id, "arrival")}
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
                                    <div className="flex items-center justify-center w-full">
                                      <span className="font-medium text-gray-700">{formatTimeJST(data.arrivalTime)}</span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 ml-2"
                                        onClick={() => startEditing(data.id, "arrival", formatTimeJST(data.arrivalTime)!)}
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
                                  {editingTime && editingTime.id === data.id && editingTime.type === "departure" ? (
                                    <div className="flex items-center justify-center gap-1 mx-auto">
                                      <Input
                                        type="text"
                                        value={editingTime.value}
                                        onChange={(e) => setEditingTime({ ...editingTime, value: e.target.value })}
                                        className="w-20 text-sm text-center"
                                        placeholder="HH:mm"
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => saveEditedTime(data.id, "departure", editingTime.value)}
                                        title="保存"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => resetTime(data.id, "departure")}
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
                                    <div className="flex items-center justify-center w-full">
                                      <span className="font-medium text-gray-700">{formatTimeJST(data.departureTime)}</span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 ml-2"
                                        onClick={() => startEditing(data.id, "departure", formatTimeJST(data.departureTime))}
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
                                  className={
                                    data.isShortUsage ? "font-medium text-red-500" : "font-medium text-gray-700"
                                  }
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
                                      <Select
                                        value={data.reason || "未選択"}
                                        onValueChange={(value) => updateReason(data.id, value)}
                                      >
                                        <SelectTrigger className="w-[75px] lg:w-[95px] h-7 text-xs mx-auto">
                                          <SelectValue placeholder="理由を選択">
                                            {getReasonDisplayText(data.reason)}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="未選択">未選択</SelectItem>
                                          <SelectItem value="利用者都合">利用者都合</SelectItem>
                                          <SelectItem value="保護者都合">保護者都合</SelectItem>
                                          <SelectItem value="事業者都合">事業者都合</SelectItem>
                                          <SelectItem value="その他">その他</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{data.reason || "未選択"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-left">
                              <Dialog
                                open={editingNote !== null && editingNote.id === data.id}
                                onOpenChange={(open) => {
                                  if (!open) setEditingNote(null)
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-full max-w-[65px] lg:max-w-[110px] xl:max-w-[140px] flex items-center justify-start px-2 text-left text-gray-600 hover:bg-gray-100 text-xs mx-auto"
                                    onClick={() => startEditingNote(data.id, data.note)}
                                  >
                                    {data.note ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            {screenWidth === null ? (
                                              ""
                                            ) : (
                                              <span className="truncate">
                                                {data.note!.length > (screenWidth < 1280 ? 10 : 20)
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
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>備考の編集</DialogTitle>
                                    <DialogDescription>{data.userName}さんの備考を入力してください</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <Textarea
                                      value={editingNote?.value || ""}
                                      onChange={(e) => setEditingNote({ ...editingNote!, value: e.target.value })}
                                      placeholder="備考を入力"
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingNote(null)}>
                                      キャンセル
                                    </Button>
                                    <Button onClick={() => saveNote(data.id, editingNote!.value)}>保存</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2 text-center">{getStatusBadge(data)}</TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ログアウト確認ダイアログ */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">ログアウト確認</DialogTitle>
            <DialogDescription className="text-center">本当にログアウトしますか？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)} className="flex-1 sm:flex-initial">
              キャンセル
            </Button>
            <Button
              onClick={() => {
                // ログアウト処理をここに実装
                setLogoutDialogOpen(false)
                // 実際のアプリケーションではログアウト処理を行う
                toast({
                  title: "ログアウトしました",
                })
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 sm:flex-initial"
            >
              ログアウト
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* トースト通知 */}
      {/* <Toaster /> */}
    </div>
  )
}