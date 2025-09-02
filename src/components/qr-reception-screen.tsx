//src/components/qr-reception-screen.tsx
"use client";

import { SCANNER_SETTINGS } from "@/config/scan-config";
import { useSidebar } from "@/context/sidebar-context";
import { useState, useEffect, useRef } from "react";
import { format, differenceInMinutes } from "date-fns";
import { ja } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  QR_SCAN_COOLDOWN_MINUTES,
  SCAN_LOCK_DURATION_MS,
  UI_RESET_DURATION_MS,
} from "@/config/scan-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import BufferedInputHandler from "@/components/buffered-input-handler";

// added by yoshida
import { useSignOutHandler } from "@/hooks/use-signout";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

import {
  useSecretReveal,
  SecretLogoutButton,
  LogoutDialog,
} from "@/components/secret-logout";
// 

import { generateClient } from "aws-amplify/data";
// import { Schema } from "../../amplify/data/resource";
import type { Schema } from "../../amplify/data/resource";
const client = generateClient<Schema>();

// メッセージの型定義
type MessageType = "info" | "success" | "warning" | "error" | "question";

interface Message {
  text: string;
  type: MessageType;
  userName: string;
}

// デモシナリオの型定義
type DemoScenario =
  | "arrival"
  | "departure"
  | "early-departure"
  | "already-departed";

// キャラクターの型定義
type Character = "cat" | "dog" | "rabbit" | "bear" | "fox";

// キャラクター設定
const characters = {
  cat: {
    name: "ニャンタ",
    color: "bg-amber-100",
    accent: "text-amber-600",
    border: "border-amber-300",
  },
  dog: {
    name: "ワンタ",
    color: "bg-blue-100",
    accent: "text-blue-600",
    border: "border-blue-300",
  },
  rabbit: {
    name: "ピョンタ",
    color: "bg-pink-100",
    accent: "text-pink-600",
    border: "border-pink-300",
  },
  bear: {
    name: "クマタ",
    color: "bg-brown-100",
    accent: "text-amber-800",
    border: "border-amber-500",
  },
  fox: {
    name: "コンタ",
    color: "bg-orange-100",
    accent: "text-orange-600",
    border: "border-orange-300",
  },
};

export default function QrReceptionScreen() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [character, setCharacter] = useState<Character>("cat");
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<
    "arrival" | "departure" | "warning" | "question" | null
  >(null);

  const [showButtons, setShowButtons] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isScanLocked, setIsScanLocked] = useState(false);

  //ミュート判定
  const [isMuted, setIsMuted] = useState(false);

  //QR読み取り成功音

  const successAudio = useRef<HTMLAudioElement | null>(null);

  // added by yoshida
  //const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  //modified  by yoshida
  const handleSignOut = useSignOutHandler();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, authStatus } = useAuthenticator();
  const router = useRouter();
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (authStatus === "configuring") return;
    if (authStatus === "unauthenticated") {
      router.replace("/"); // 未認証時にリダイレクト
    }

    (async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const raw = tokens?.idToken?.payload?.["cognito:groups"];
        const groups: string[] = Array.isArray(raw) ? (raw as string[]) : [];

        const isAdmin = groups.includes("admin");
        //const isUser = groups.includes("user");

        if (isAdmin && !signingOutRef.current) {
          signingOutRef.current = true;
          await handleSignOut(); // ここでセッションを落とす
          setTimeout(() => {
            router.replace("/"); //遷移の履歴を残さない(ブラウザーバックを防ぐ)
          }, 100);
        }
      } catch {
        // 失敗時は安全側で落とす
        if (!signingOutRef.current) {
          signingOutRef.current = true;
          await handleSignOut();
          setTimeout(() => {
            router.replace("/"); //遷移の履歴を残さない(ブラウザーバックを防ぐ)
          }, 100);
        }
      }
    })();
  }, [authStatus, router]);




  // 隠しボタンの表示ロジック
  const { visible, onPressStart, onPressEnd } = useSecretReveal({
    holdMs: null, 
    autoHideMs: 6000,
    hotkey: "m",
  });

  // ダイアログ制御
  const [logoutOpen, setLogoutOpen] = useState(false);
  
  
  useEffect(() => {
    successAudio.current = new Audio("/sounds/maou_se_system23.mp3");
    successAudio.current.preload = "auto";
    successAudio.current.load();
  }, []);

  const playSuccessSound = () => {
    if (!isMuted && successAudio.current) {
      successAudio.current.currentTime = 0; // 先頭に戻す
      successAudio.current.play().catch(console.warn);
    }
  };

  const lastPlayTimeRef = useRef<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (!isMuted && now - lastPlayTimeRef.current > 3000) {
      playSuccessSound();
      lastPlayTimeRef.current = now;
    }
  };

  const { toggle } = useSidebar();
  const handleScanComplete = async (rawChildId: string) => {
    //確認用sound
    playSuccessSound();
    if (isScanLocked) {
      console.log("スキャンはロック中（再試行不可）");
      return;
    }
    setIsScanLocked(true);

    playSuccessSound(); // 音声ファイル呼び出し
    console.log("✅ QRスキャン受信:", rawChildId);
    const cleanedChildId = rawChildId
      .trim()
      .replace(/\s/g, "")
      .normalize("NFKC");
    const visitDate = format(new Date(), "yyyy-MM-dd");
    const now = new Date();

    try {
      const visitRecordResult = await client.models.VisitRecord.list({
        filter: { visitDate: { eq: visitDate } },
        authMode: "userPool",
      });

      console.log("✅ VisitRecord.list 完了:", visitRecordResult);

      const records: Schema["VisitRecord"]["type"][] =
        (visitRecordResult as any).data ?? [];
      console.log("✅ records:", records);

      const match = records.find((r) => r.recipientId === cleanedChildId);
      console.log("✅ match:", match);

      if (match) {
        let userName = cleanedChildId;
        // recipientId から氏名を取得
        const recipientResult = await client.models.Recipient.list({
          filter: { recipientId: { eq: match.recipientId } },
          authMode: "userPool",
        });
        const recipientData = recipientResult.data?.[0];
        if (recipientData) {
          const lastName = recipientData.lastName ?? "";
          const firstName = recipientData.firstName ?? "";
          userName =
            lastName || firstName
              ? `${lastName} ${firstName}`.trim()
              : match.recipientId;
        }

        // ✅ 退所済みなら受け付けない
        if (match.actualLeaveTime) {
          console.log("退所済み → スキップ");

          return;
        }

        // ✅ arrival 済みなら15分以内は無効
        if (match.actualArrivalTime) {
          const lastArrival = parseTime(match.actualArrivalTime);
          if (
            differenceInMinutes(now, lastArrival) < QR_SCAN_COOLDOWN_MINUTES
          ) {
            console.log("15分以内の再読み取り → スキップ");

            return;
          }
        }

        // ✅ arrival 未登録 → arrival 記録
        if (!match.actualArrivalTime) {
          await client.models.VisitRecord.update(
            {
              id: match.id,
              actualArrivalTime: format(now, "HH:mm"),
              updatedAt: now.toISOString(),
              updatedBy: "qr-reader",
            },
            { authMode: "userPool" }
          );

          setMessage({
            text: "こんにちは！\n今日もがんばろう！",
            type: "success",
            userName,
          });
          setAnimationType("arrival");
          setShowAnimation(true);
          triggerConfetti();

          scheduleReset();
          return;
        }

        // ✅ arrival 済みで leave 未実施 → leave 記録

        const leaveTime = format(now, "HH:mm");
        const duration = match.actualArrivalTime
          ? differenceInMinutes(
              parseTime(leaveTime),
              parseTime(match.actualArrivalTime)
            )
          : null;

        await client.models.VisitRecord.update(
          {
            id: match.id,
            actualLeaveTime: leaveTime,
            actualDuration: duration ?? undefined, // ← 実利用時間を保存
            updatedAt: now.toISOString(),
            updatedBy: "qr-reader",
          },
          { authMode: "userPool" }
        );

        setMessage({
          text: "おつかれさま！\n気を付けて帰ってね！",
          type: "success",
          userName,
        });
        setAnimationType("departure");
        setShowAnimation(true);
        triggerConfetti();

        scheduleReset();
        return;
      }

      // ✅ レコードがない場合 → Recipient を確認して新規作成
      console.log("🔍 Recipient.list 開始");
      const recipientResult = await client.models.Recipient.list({
        filter: { recipientId: { eq: cleanedChildId } },
        authMode: "userPool",
      });
      console.log("✅ Child.list 完了:", recipientResult);

      const recipients = recipientResult.data ?? [];
      if (!recipients.length) return;
      const recipient = recipients[0];
      const userName = `${recipient.lastName}${recipient.firstName}`;

      // ✅ 新規作成処理
      console.log("✅ VisitRecord.create 開始:", cleanedChildId);
      await client.models.VisitRecord.create(
        {
          visitRecordId: crypto.randomUUID(),
          visitDate,
          actualArrivalTime: format(now, "HH:mm"),
          recipientId: recipient.recipientId,
          officeId: recipient.officeId!, // ✅ 必須（Facility.officeId と一致）
          isManuallyEntered: false, // QRなので false
          isDeleted: false,
          // 初期値が必要なら（任意）
          // reason: "0",
          createdAt: now.toISOString(),
          createdBy: "qr-reader",
          updatedAt: now.toISOString(),
          updatedBy: "qr-reader",
        },
        { authMode: "userPool" }
      );

      console.log("✅ VisitRecord.create 完了");
      setMessage({
        text: "こんにちは！\n今日もがんばろう！",
        type: "success",
        userName,
      });
      setAnimationType("arrival");
      setShowAnimation(true);
      triggerConfetti();
      scheduleReset();
    } catch (error) {
      console.error("エラー:", error);
      setMessage({
        text: "エラーが発生しました。ネットワークや認証を確認してください。",
        type: "error",
        userName: "",
      });
      scheduleReset();
    } finally {
      // 3秒後に再スキャン許可
      setTimeout(() => setIsScanLocked(false), SCAN_LOCK_DURATION_MS);
    }
  };

  const parseTime = (time: string): Date => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  // 現在の日付
  const today = new Date();
  const formattedDate = format(today, "yyyy年MM月dd日(E)", { locale: ja });

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

  // 現在の日付と時刻の更新
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = format(now, "HH時mm分");
      const dateStr = format(now, "yyyy年MM月dd日(E)", { locale: ja });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 初期メッセージの設定
  useEffect(() => {
    setMessage({
      text: "QRコードをよみこませてね！",
      type: "info",
      userName: "",
    });
  }, []);

  // 5秒後に待ち受け状態に戻す関数
  const scheduleReset = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      setMessage({
        text: "QRコードをよみこませてね！",
        type: "info",
        userName: "",
      });
      setShowAnimation(false);
      setAnimationType(null);
      setShowButtons(false);
    }, UI_RESET_DURATION_MS);
  };

  // 紙吹雪エフェクト
  const triggerConfetti = () => {
    if (confettiRef.current) {
      const rect = confettiRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ["#FFC107", "#FF9800", "#FF5722", "#4CAF50", "#2196F3"],
      });
    }
  };

  // QRコードスキャンのシミュレーション
  const simulateQrScan = (scenario: DemoScenario) => {
    // 既存のタイマーをクリア
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // ランダムなユーザー名を生成
    const users = ["山田太郎", "佐藤花子", "鈴木一郎", "田中美咲"];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // ランダムなキャラクターを選択
    const characterTypes: Character[] = ["cat", "dog", "rabbit", "bear", "fox"];
    const randomCharacter =
      characterTypes[Math.floor(Math.random() * characterTypes.length)];
    setCharacter(randomCharacter);

    switch (scenario) {
      case "arrival":
        playSuccessSound(); // クリックして音が鳴る（本番時に消す）
        setMessage({
          text: "こんにちは！\n今日もがんばろう！",
          type: "success",
          userName: randomUser,
        });
        setAnimationType("arrival");
        setShowAnimation(true);
        setShowButtons(false);
        triggerConfetti();
        scheduleReset();
        break;
      case "departure":
        setMessage({
          text: "おつかれさま！\n気を付けて帰ってね！",
          type: "success",
          userName: randomUser,
        });
        setAnimationType("departure");
        setShowAnimation(true);
        setShowButtons(false);
        triggerConfetti();
        scheduleReset();
        break;
      case "early-departure":
        setMessage({
          text: "帰るのが早いかも？\n先生にきいてみて！",
          type: "question",
          userName: randomUser,
        });
        setAnimationType("question");
        setShowAnimation(true);
        setShowButtons(true);
        // 早退時は自動リセットしない
        break;
      case "already-departed":
        setMessage({
          text: "もうよみこんでるかも？\n先生にきいてみて！",
          type: "warning",
          userName: randomUser,
        });
        setAnimationType("warning");
        setShowAnimation(true);
        setShowButtons(false);
        scheduleReset();
        break;
      default:
        break;
    }
  };

  // 「はい」ボタンのハンドラー
  const handleYes = () => {
    if (!message) return;

    if (message.text.includes("帰るのが早いかも？")) {
      setMessage({
        text: "おつかれさま！\n気を付けて帰ってね！",
        type: "success",
        userName: message.userName,
      });
      setAnimationType("departure");
      setShowAnimation(true);
      setShowButtons(false);
      triggerConfetti();

      scheduleReset();
    }
  };

  // 「いいえ」ボタンのハンドラー
  const handleNo = () => {
    setMessage({
      text: "もう少しいるんだね！\nたのしんでね！",
      type: "info",
      userName: message?.userName || "",
    });
    setShowButtons(false);

    scheduleReset();
  };

  // キャラクターコンポーネント
  const CharacterComponent = () => {
    const characterConfig = characters[character];

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative w-40 h-40 rounded-full ${characterConfig.color} ${characterConfig.border} border-4 overflow-hidden shadow-lg mx-auto mb-4`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={`/placeholder.svg?height=160&width=160&text=${characterConfig.name}`}
            alt={characterConfig.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* キャラクターの表情（静的表示） */}
        {showAnimation && (
          <div className="absolute inset-0 flex items-center justify-center">
            {animationType === "arrival" && (
              <span className="text-4xl">😊</span>
            )}
            {animationType === "departure" && (
              <span className="text-4xl">👋</span>
            )}
            {animationType === "question" && (
              <span className="text-4xl">🤔</span>
            )}
            {animationType === "warning" && (
              <span className="text-4xl">😮</span>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        backgroundImage: "url('/images/sky-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col overflow-auto p-4">
        <div
          className="grid flex-1 gap-4"
          style={{ gridTemplateRows: showButtons ? "1fr auto" : "1fr" }}
        >


          {/* メッセージ表示エリア - 透明背景 */}
          <div className="flex flex-col relative overflow-hidden">
            {/* ミュートボタン */}
            {/*
            <Button
              onClick={() => setIsMuted((prev) => !prev)}
              variant="outline"
              className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm text-black shadow-md px-4 py-1 rounded-lg"
            >
              {isMuted ? "🔇 ミュート中" : "🔊 音あり"}
            </Button>
             */}

            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
               {/* 隠しログアウト（左）。 ⌘/Ctrl+Alt+g で visible=true になった時だけ出現 */}
                <SecretLogoutButton
                  visible={visible}
                  onClick={() => setLogoutOpen(true)}
                />

              {/* ミュート（右）。短押し=ミュート切替、長押し=隠しログアウトの出現 */}
                <Button
                  variant="outline"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="bg-white/90 backdrop-blur-sm text-black shadow-md px-4 py-1 rounded-lg"
                >
                  {isMuted ? "🔇 ミュート中" : "🔊 音あり"}
                </Button>
            </div>


            <div className="flex flex-1 flex-col items-center justify-center p-6">
              {/* 紙吹雪のためのref */}
              <div
                ref={confettiRef}
                className="absolute inset-0 pointer-events-none"
              ></div>

              {/* キャラクター表示 */}
              {message?.userName && <CharacterComponent />}

              <AnimatePresence mode="wait">
                <motion.div
                  key={message?.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex w-full flex-col items-center text-center"
                >
                  {message?.userName && (
                    <motion.h2
                      className="mb-4 text-4xl font-bold text-black bg-white/80 rounded-lg px-4 py-2"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {message.userName}さん
                    </motion.h2>
                  )}
                  <div className="whitespace-pre-line mb-4">
                    <div className="text-6xl font-bold text-black bg-white/80 rounded-lg px-6 py-4 inline-block">
                      {message?.text}
                    </div>
                  </div>
                  {/* 日時表示 */}
                  <div className="text-2xl text-black bg-white/80 rounded-lg px-4 py-2">
                    {currentDate} {currentTime}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* デモシナリオボタン（開発者用） */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("arrival")}
                  className="border-dashed border-gray-300 bg-white/80 hover:bg-white text-xs h-7 px-2"
                >
                  来所QR読み込みデモ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("departure")}
                  className="border-dashed border-gray-300 bg-white/80 hover:bg-white text-xs h-7 px-2"
                >
                  退所QR読み込みデモ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("early-departure")}
                  className="border-dashed border-gray-300 bg-white/80 hover:bg-white text-xs h-7 px-2"
                >
                  契約時間未達QR読み込みデモ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateQrScan("already-departed")}
                  className="border-dashed border-gray-300 bg-white/80 hover:bg-white text-xs h-7 px-2"
                >
                  既退所QR読み込みデモ
                </Button>
              </div>
            </div>
          </div>

          {/* 操作ボタンエリア - 早退時のみ表示（低解像度対応） */}
          {showButtons && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-20"
            >
              <Card className="bg-white/90 backdrop-blur-sm h-full">
                <CardContent className="flex items-center justify-center p-4 h-full">
                  <div className="flex gap-6">
                    <Button
                      size="lg"
                      onClick={handleYes}
                      className="bg-blue-500 hover:bg-blue-600 px-8 text-lg h-12"
                    >
                      <span className="mr-2">👍</span>
                      はい
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleNo}
                      className="border-2 px-8 text-lg h-12 bg-transparent"
                    >
                      <span className="mr-2">👎</span>
                      いいえ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <LogoutDialog
          open={logoutOpen}
          onOpenChange={setLogoutOpen}
          onConfirm={async () => { console.log('clicked'); await handleSignOut(); }}
        
          isLoading={isLoggingOut}
      />
    
      {/* トースト通知 */}
      <Toaster />
      <BufferedInputHandler
        // onKeyDown={handleKeyDown}
        onScanComplete={handleScanComplete}
        reverse={SCANNER_SETTINGS.reverse}
      />
    </div>
  );
}
