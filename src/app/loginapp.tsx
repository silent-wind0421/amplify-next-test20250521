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

async function afterSignIn(destination: string) {
    const { tokens } = await fetchAuthSession()
    const idToken = tokens?.idToken?.toString()
    
    if (!idToken) throw new Error('no id token')
    
    const r = await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include', 
      body: JSON.stringify({ idToken }),
    })

    if (!r.ok) throw new Error('session set failed')
  }

export default function LoginApp({destination, loginType}:LoginAppProps) {
  //認証情報の取得
  const router = useRouter()
  const { user, authStatus } = useAuthenticator((ctx) => [ctx.user, ctx.authStatus])
  const bridged = useRef(false) // 二重実行防止

  useEffect(() => {
    const doBridge = async () => {
      if (bridged.current) return;

      // ★ 直前ログアウトのマーカーがあれば一度だけスキップ
      const sp = new URLSearchParams(location.search);
      if (sp.get("justSignedOut") === "1") {
        sp.delete("justSignedOut");
        bridged.current = true;               // ← 同一マウント中の多重起動防止
        router.replace(`${location.pathname}${sp.toString() ? `?${sp}` : ""}`);
        bridged.current = false;
        return;
      }

      // ★ 本当にトークンがあるかを確認（無ければ橋渡ししない）
      const { tokens } = await fetchAuthSession().catch(() => ({ tokens: null as any }));
      const idToken = tokens?.idToken?.toString();
      if (!idToken) return;

      bridged.current = true;
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!r.ok) { bridged.current = false; return; }

      const p = new URLSearchParams(location.search);
      const next = p.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.replace(safeNext || destination);
    };

    // ★ Hub で “signedIn” のときだけブリッジを走らせる
    const unsub = Hub.listen("auth", (caps) => {
      if (caps.payload?.event === "signedIn") doBridge();
    });

    // 既にログイン済みでこの画面に来たケースにも対応（初期1回だけ試す）
    doBridge();

    return () => { unsub(); };
  }, [destination, router]);

  {/*
  useEffect(() => {
    if (authStatus === 'authenticated' && !bridged.current) {

       if (localStorage.getItem('signedOut') === '1') {
            localStorage.removeItem('signedOut')
            return
        }

      bridged.current = true;
      (async () => {
        await afterSignIn(destination)
        const p = new URLSearchParams(location.search)
        const next = p.get('next')
        const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
        router.replace(safeNext || destination)
      })().catch((e) => {
        bridged.current = false // 失敗時は次回のために戻す
        console.error(e)
      })
    }
  }, [authStatus, destination, router])
  */}

  return (
    <main className="flex items-center justify-center h-screen">

      {authStatus === 'authenticated' && (
        <LoginAudit
          user={user}
          authStatus={authStatus}
          destination={destination}
        />
      )}
      
    </main>
  );
}
