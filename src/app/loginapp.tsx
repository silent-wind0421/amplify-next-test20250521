"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useForceSignOutOnMount } from "@/hooks/use-forcedsignout";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Hub } from "aws-amplify/utils";
import { useSignOutHandler } from "@/hooks/use-signout";

import LoginAudit from "./loginaudit"; 

type LoginAppProps = {
  destination: string; // 省略時のデフォルトも用意
  loginType: "user" | "admin";  // このログイン画面の種別
};


export default function LoginApp({destination, loginType}:LoginAppProps) {
  //認証情報の取得
  const { user, authStatus, signOut } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  const router = useRouter();
  const [checked, setChecked] = useState(false);  // 役割チェックが終わったか
  const [allowed, setAllowed] = useState(false);  // この画面に入れるか
  
  const handleSignOut = useSignOutHandler();

  // サインアウト後の遷移先を一時保持
  const redirectAfterSignOutRef = useRef<string | null>(null);

  // StrictMode の二重実行を避けるガード（任意）
  const subscribedRef = useRef(false);
  const signoutTriggeredRef = useRef(false);

  // Hub 購読は一度だけ
  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsub = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedOut") {
        const to = redirectAfterSignOutRef.current ?? "/login-user";
        redirectAfterSignOutRef.current = null;
        router.replace(to);
      }
    });

    return () => {
      unsub();
      subscribedRef.current = false;
    };
  }, [router]);

  useEffect(() => {
    const verify = async () => {
      // Authenticator の子なので、ここに来る時点で authenticated のはずですが、
      // 念のためガードしておく
      if (authStatus !== "authenticated" || !user) return;

      // トークンからグループを取得
      const { tokens } = await fetchAuthSession();
      const raw = tokens?.idToken?.payload?.["cognito:groups"];
      const groups: string[] = Array.isArray(raw) ? (raw as string[]) : [];

      const isAdmin = groups.includes("admin");
      const isUser = groups.includes("user");
      //const isUser = groups.includes("user") || isAdmin; // admin は user 相当として可

      
      const ok =
        (loginType === "admin" && isAdmin) ||
        (loginType === "user" && isUser);

      if (!ok) {
        // ここがポイント
        const desired =
          loginType === "admin" ? "/login-admin?e=perm" : "/login-user?e=perm";
          const current = `${window.location.pathname}${window.location.search}`;

        // サインアウトを目的地で行わせる合図
        sessionStorage.setItem("forceSignOut", "1");

        if (current === desired) {
          // すでに目的地にいる → 置き換えず、一度だけ signOut 実行
          if (!signoutTriggeredRef.current) {
            signoutTriggeredRef.current = true;
            handleSignOut();
          }
          return;
        }

        // まだ目的地にいない → 一回だけハード置き換え
        window.location.replace(desired);
        return;
      }

      setAllowed(true);
      setChecked(true);
    };

    verify();
  }, [authStatus, user, loginType, router, signOut]);

  // 役割判定が終わるまで何も出さない（チラつき防止）
  if (!checked) return null;


  return (
    <main className="flex items-center justify-center h-screen">

      {allowed && (
        <LoginAudit
          user={user}
          authStatus={authStatus}
          destination={destination}
        />
      )}
      
      <div>
        <p className="text-lg mb-4">現在、更新中・・・</p>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          サインアウト
        </button>
      </div>
    </main>
  );
}
