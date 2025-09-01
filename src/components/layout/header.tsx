// src/components/layout/header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, Menu } from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

//modified  by yoshida
import { useSignOutHandler } from "@/hooks/use-signout";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

type HeaderProps = {
  className?: string;
};

export function Header({ className = "" }: HeaderProps) {
  const { toggle } = useSidebar();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

        // const isAdmin = groups.includes("admin");
        const isUser = groups.includes("user");

        if (isUser && !signingOutRef.current) {
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
          }, 50);
        }
      }
    })();
  }, [authStatus, router]);

  const ENABLE_SIDEBAR = false as const;

  return (
    <>
      <header className="fixed left-0 top-0 w-full z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center">
          {ENABLE_SIDEBAR ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            // ボタン幅と同等のスペーサで見た目キープ
            // <div className="w-10 mr-2" aria-hidden />
            <div />
          )}
          <h1 className="text-xl font-bold text-gray-800">こたより</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="mr-4 text-sm font-medium text-gray-700">
              {user?.signInDetails?.loginId} {/* modified by yoshida */}
            </span>
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

      {/* ログアウト確認ダイアログ */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              ログアウト確認
            </DialogTitle>
            <DialogDescription className="text-center">
              本当にログアウトしますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              className="flex-1 sm:flex-initial"
            >
              キャンセル
            </Button>
            <Button
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await handleSignOut(); // カスタムフックによる signOut 処理
                  toast.success("ログアウトしました");
                } catch (error) {
                  toast.error("ログアウトに失敗しました");
                  setIsLoggingOut(false);
                }
              }}
              disabled={isLoggingOut}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white sm:flex-initial"
            >
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
