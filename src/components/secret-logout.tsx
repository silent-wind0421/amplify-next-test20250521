"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ============================
   Hook: useSecretReveal
   - 長押しで表示 (デフォ 800ms)
   - ⌘/Ctrl + L でも表示
   - 一定時間で自動非表示 (デフォ 6000ms)
============================ */
export type SecretOptions = {
  holdMs?: number | null;      // 長押し発火までの時間
  autoHideMs?: number;  // 自動で隠すまでの時間
  hotkey?: string;      // 例: "l"
};

export function useSecretReveal(options?: SecretOptions) {
  const holdMs = options?.holdMs ?? 800;
  const autoHideMs = options?.autoHideMs ?? 6000;
  const hotkey = (options?.hotkey ?? "m").toLowerCase();

  const [visible, setVisible] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const reveal = () => {
    setVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), autoHideMs);
  };

  const onPressStart = () => {
    if (pressTimerRef.current) return;
    pressTimerRef.current = window.setTimeout(() => {
      reveal();
      pressTimerRef.current = null;
    }, holdMs);
  };

  const onPressEnd = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // ⌘/Ctrl + hotkey で表示

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // SSR 安全
      const isMac =
        typeof navigator !== "undefined" &&
        /mac/i.test(navigator.platform || "");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        reveal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, autoHideMs]);
  

  {/*
  useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    // 入力中は無効化（任意だが推奨）
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

    const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform || "");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // ★ Ctrl/⌘ + Alt /+ hotkey（例: L）
    if (mod && e.altKey && e.key.toLowerCase() === hotkey) {
      e.preventDefault(); // ブラウザ既定動作をブロック
      reveal();           // 隠しボタンを表示
    }
  };

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
　}, [hotkey, autoHideMs]);

 */}

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return {
    visible,
    setVisible,      // 必要なら手動制御も可能
    reveal,          // 任意のタイミングで表示したいとき用
    onPressStart,    // ミュートボタン等に割り当て（長押し検出）
    onPressEnd,      // ミュートボタン等に割り当て（長押し解除）
  };
}

/* ============================
   Component: SecretLogoutButton
   - visible=true のときだけ表示
   - クリックで onClick（ダイアログを開くなど）
============================ */
export type SecretLogoutButtonProps = {
  visible: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
  "aria-label"?: string;
};

export function SecretLogoutButton({
  visible,
  onClick,
  className,
  title = "ログアウト",
  ...rest
}: SecretLogoutButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className={
            className ??
            "bg-white/90 backdrop-blur-sm text-black shadow-md px-3 py-1 rounded-full border border-black/10 hover:bg-white"
          }
          title={title}
          aria-label={rest["aria-label"] ?? "ログアウト"}
        >
          <LogOut className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ============================
   Component: LogoutDialog
   - ヘッダーのダイアログUIを再利用できる汎用版
============================ */
export type LogoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void; // 実際の signOut を渡す
  isLoading?: boolean;
  labels?: {
    title?: string;
    description?: string;
    cancel?: string;
    confirm?: string;
    confirming?: string;
  };

  closeOnSuccess?: boolean;
};

export function LogoutDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  labels,
  closeOnSuccess = false,  
}: LogoutDialogProps) {
  const t = {
    title: labels?.title ?? "ログアウト確認",
    description: labels?.description ?? "本当にログアウトしますか？",
    cancel: labels?.cancel ?? "キャンセル",
    confirm: labels?.confirm ?? "ログアウト",
    confirming: labels?.confirming ?? "ログアウト中...",
  };

  // 親が isLoading を立て忘れても多重実行を防ぐためのローカルガード
  const busyRef = useRef(false);
  const [localBusy, setLocalBusy] = useState(false);
  const busy = !!isLoading || localBusy;

  const safeClose = (next: boolean) => {
    // 処理中は閉じない（Esc/外側クリック/明示クローズすべて）
    if (busy) return;
    onOpenChange(next);
  };

  const handleConfirmClick = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLocalBusy(true);
    try {
      const r = onConfirm();
      if (r && typeof (r as Promise<unknown>).then === "function") {
        await (r as Promise<unknown>);
      }
      if (closeOnSuccess){

        onOpenChange(false);
        return;
      } 
    } finally {
      
      if (!closeOnSuccess) {
        setLocalBusy(false);
        busyRef.current = false;
      }     
      
    }
  };

  return (
    <Dialog open={open} onOpenChange={safeClose}>
      <DialogContent
        className="sm:max-w-md"
        // Radixの外側クリック/Escを個別に塞ぎたい場合は以下を追加（任意）
        // onPointerDownOutside={(e) => busy && e.preventDefault()}
        // onEscapeKeyDown={(e) => busy && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{t.title}</DialogTitle>
          <DialogDescription className="text-center">
            {t.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => safeClose(false)}
            disabled={busy}
            className="flex-1 sm:flex-initial"
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={busy}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white sm:flex-initial"
          >
            {busy ? t.confirming : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
  