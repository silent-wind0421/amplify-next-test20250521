"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { LogOut, Clock, Calendar } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// メッセージの型定義
type MessageType = "info" | "success" | "warning" | "error" | "question"

interface Message {
  text: string
  type: MessageType
  userName: string
}

// デモシナリオの型定義
type DemoScenario = "arrival" | "departure" | "early-departure" | "already-departed"

export default function QrReceptionScreen() {
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

      toast({
        title: "退所を記録しました",
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
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800">プロジェクト名</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-sm text-gray-600 md:flex">
            <Clock className="h-4 w-4" />
            <span>{currentTime}</span>
          </div>
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
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col overflow-auto p-6">
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-blue-500 py-3 text-white">
            <CardTitle className="text-lg font-bold">QR待ち受け画面</CardTitle>
            <div className="flex items-center rounded bg-white/20 overflow-hidden">
              <div className="px-3 py-1 text-white cursor-text hover:bg-white/10 transition-colors text-sm">
                {formattedDate}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/30 rounded-none">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid flex-1 grid-rows-[1fr_auto] gap-6">
          {/* メッセージ表示エリア - ユーザーアイコンなし */}
          <Card className="flex flex-col">
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

              {/* デモシナリオボタン */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("arrival")}
                  className="border-dashed border-gray-300"
                >
                  来所QR読み込みデモ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("departure")}
                  className="border-dashed border-gray-300"
                >
                  退所QR読み込みデモ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("early-departure")}
                  className="border-dashed border-gray-300"
                >
                  契約時間未達QR読み込みデモ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("already-departed")}
                  className="border-dashed border-gray-300"
                >
                  既退所QR読み込みデモ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 操作ボタンエリア */}
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={handleYes}
                  className="bg-blue-500 hover:bg-blue-600 px-8 text-lg"
                  disabled={!message || message.type !== "question"}
                >
                  はい
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleNo}
                  className="border-2 px-8 text-lg"
                  disabled={!message || message.type !== "question"}
                >
                  いいえ
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                <p>QRコードを読み取り後、操作を選択してください</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

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
      <Toaster />
    </div>
  )
}
