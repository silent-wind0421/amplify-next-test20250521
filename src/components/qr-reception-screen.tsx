//src/components/qr-reception-screen.tsx
"use client"

import { useSidebar } from "@/context/sidebar-context"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { LogOut, Clock, Calendar, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BufferedInputHandler from "@/components/buffered-input-handler"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
// import { Toaster } from "@/components/ui/toaster"

// メッセージの型定義
type MessageType = "info" | "success" | "warning" | "error" | "question"

interface Message {
  text: string
  type: MessageType
  userName: string
}

// // デモシナリオの型定義
// type DemoScenario = "arrival" | "departure" | "early-departure" | "already-departed"

export default function QrReceptionScreen() {
  const { toggle } = useSidebar()
  const handleScanComplete = (value: string) => {
    console.log("🔍 スキャナ入力:", value)

    if (value.includes("arrival")) {
      simulateQrScan("arrival")
    } else if (value.includes("departure")) {
      simulateQrScan("departure")
    } else {
      setMessage({
        text: `読み取り成功: ${value}`,
        type: "info",
        userName: "",
      })
    }
  }


  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [message, setMessage] = useState<Message | null>(null)

  // 現在の日付
  const today = new Date()
  const formattedDate = format(today, "yyyy年MM月dd日(E)", { locale: ja })

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

  // 初期メッセージの設定
  useEffect(() => {
    setMessage({
      text: "QRコードをスキャンしてください",
      type: "info",
      userName: "",
    })
  }, [])

  // QRコードスキャンのシミュレーション
  const simulateQrScan = (scenario: DemoScenario) => {
    // ランダムなユーザー名を生成
    const users = ["山田太郎", "佐藤花子", "鈴木一郎", "田中美咲"]
    const randomUser = users[Math.floor(Math.random() * users.length)]

    switch (scenario) {
      case "arrival":
        setMessage({
          text: "こんにちは！",
          type: "success",
          userName: randomUser,
        })
        break
      case "departure":
        setMessage({
          text: "おつかれさまでした",
          type: "success",
          userName: randomUser,
        })
        break
      case "early-departure":
        setMessage({
          text: "契約時間に達していませんが、帰宅されますか？",
          type: "question",
          userName: randomUser,
        })
        break
      case "already-departed":
        setMessage({
          text: "退所時刻が登録されています。スタッフに声をかけてください。",
          type: "warning",
          userName: randomUser,
        })
        break
      default:
        break
    }
  }

  // 「はい」ボタンのハンドラー
  const handleYes = () => {
    if (!message) return

    if (message.text.includes("契約時間に達していません")) {
      setMessage({
        text: "おつかれさまでした",
        type: "success",
        userName: message.userName,
      })

      toast("退所を記録しました", {

        description: `${message.userName}さん - ${currentTime}`,
      })
    }

    // 3秒後にメッセージをクリア
    setTimeout(() => {
      setMessage({
        text: "QRコードをスキャンしてください",
        type: "info",
        userName: "",
      })
    }, 3000)
  }

  // 「いいえ」ボタンのハンドラー
  const handleNo = () => {
    setMessage({
      text: "操作をキャンセルしました",
      type: "info",
      userName: "",
    })

    // 2秒後にメッセージをクリア
    setTimeout(() => {
      setMessage({
        text: "QRコードをスキャンしてください",
        type: "info",
        userName: "",
      })
    }, 2000)
  }

  // メッセージタイプに基づくスタイルを取得
  const getMessageStyles = () => {
    switch (message?.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "question":
        return "bg-blue-50 border-blue-200 text-blue-800"
      case "info":
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  return (
    <>
      {/* タイトル・日付表示 */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-blue-500 py-3 text-white">
          <CardTitle className="text-lg font-bold">QR待ち受け画面</CardTitle>
          <div className="flex items-center rounded bg-white/20 overflow-hidden">
            <div className="px-3 py-1 text-white text-sm">{formattedDate}</div>
          </div>
        </CardHeader>
      </Card>

      {/* メッセージ表示 */}
      <Card className="mb-6 flex flex-col">
        <CardContent className="flex flex-1 flex-col items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={message?.text}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex w-full flex-col items-center rounded-lg border p-6 text-center shadow-sm ${getMessageStyles()}`}
            >
              {message?.userName && <h2 className="mb-4 text-3xl">{message.userName}さん</h2>}
              <p className="text-2xl font-medium">{message?.text}</p>
            </motion.div>
          </AnimatePresence>

          {/* デモボタン */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Button onClick={() => simulateQrScan("arrival")}>来所QR読み込みデモ</Button>
            <Button onClick={() => simulateQrScan("departure")}>退所QR読み込みデモ</Button>
            <Button onClick={() => simulateQrScan("early-departure")}>契約時間未達デモ</Button>
            <Button onClick={() => simulateQrScan("already-departed")}>既退所デモ</Button>
          </div>
        </CardContent>
      </Card>

      {/* 操作ボタン */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex gap-4">
            <Button onClick={handleYes} disabled={message?.type !== "question"}>
              はい
            </Button>
            <Button variant="outline" onClick={handleNo} disabled={message?.type !== "question"}>
              いいえ
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            <p>QRコードを読み取り後、操作を選択してください</p>
          </div>
        </CardContent>
      </Card>

      {/* ダイアログもこの中でOK */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">ログアウト確認</DialogTitle>
            <DialogDescription className="text-center">本当にログアウトしますか？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                setLogoutDialogOpen(false)
                toast("ログアウトしました")
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              ログアウト
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BufferedInputHandler onScanComplete={handleScanComplete} />
    </>
  )
}
