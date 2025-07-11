// src/components/app-root.tsx
"use client";

import { useEffect, useRef } from "react";
import { startVisitRecordRealtimeWatcher } from "@/lib/realtime-visitrecord";
import { Amplify } from "aws-amplify";
import { isSignedIn } from "@/lib/amplify-auth";

/**
 * アプリケーションのトップレベルで副作用（watcher の開始）を処理するコンポーネント。
 *
 * - `Amplify.configure()` の完了を検知し、`VisitRecord` モデルの observeQuery を購読開始する。
 * - GraphQL エンドポイントが未設定 or 未認証なら購読を開始せずスキップする。
 * - `useRef` を使い watcher の起動を1回に制限。
 * - `useEffect` のクリーンアップ関数で `unsubscribe()` を呼び出す。
 */
export function AppRoot() {
  const startedRef = useRef(false);
  const unsubscribeRef = useRef<() => void>();

  useEffect(() => {
    const init = async () => {
      const config = Amplify.getConfig();
      const signedIn = await isSignedIn();

      console.log("Amplify.getConfig()", config); // ★ 確認用
      console.log("isSignedIn():", signedIn); // ★ 確認用

      if (!config?.API?.GraphQL?.endpoint || !signedIn) {
        console.warn("未認証または未初期化のため watcher を起動しません");
        return;
      }

      if (!startedRef.current) {
        const sub = startVisitRecordRealtimeWatcher();
        unsubscribeRef.current = () => sub.unsubscribe();
        startedRef.current = true;
      }
    };

    init();

    // アンマウント時のクリーンアップ
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        console.log("watcher を停止しました");
      }
    };
  }, []);

  return null;
}
