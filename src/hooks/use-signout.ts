// src/hooks/use-signout.ts
'use client'
import { useRef } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from "next/navigation";

type Group = string

export function useSignOutHandler(group: Group, redirectPath: `/${string}`) {
  const { signOut } = useAuthenticator()
  const inFlight = useRef(false)
  const router = useRouter();
 // console.log('呼ばれてる？');

  return async function handleSignOut() {

    console.log('[use-signout] called');

    if (inFlight.current) { console.warn('[signout] already running'); return }
  //  if (inFlight.current) return
    inFlight.current = true

    // 先に遷移先URLを作っておく
    const url = new URL(redirectPath, location.origin)

    console.log('[signout] start → to', url.toString())

    try {
      sessionStorage.clear()

      // 1) Amplifyサインアウト
      await signOut()

      // 2) サーバー側クッキー削除（必ず include）
      const r = await fetch('/api/session', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!r.ok) {
        console.error('session DELETE failed', r.status)
        
      }
    } catch (e) {
      console.error('handleSignOut error:', e)
      // 失敗しても遷移は続ける
    } finally {
      inFlight.current = false
      // 3) 成否に関わらずログインへ退避（ループ/タイムラグ回避にハード遷移）
     // location.replace(url.toString())
      router.replace(url.toString())
      
    }
  }
}
