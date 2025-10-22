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
    if (authStatus === 'authenticated' && !bridged.current) {
      bridged.current = true
      ;(async () => {
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
  

  return (
    <main className="flex items-center justify-center h-screen">

      {authStatus === 'authenticated' && (
        <LoginAudit
          user={user}
          authStatus={authStatus}
          destination={destination}
        />
      )}
      
      {/*
      <div>
        <p className="text-lg mb-4">現在、更新中・・・</p>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          サインアウト
        </button>
      </div>
      */}
    </main>
  );
}
