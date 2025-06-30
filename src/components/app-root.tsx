// src/components/app-root.tsx
"use client";

import { useEffect, useState } from "react";
import { startVisitRecordRealtimeWatcher } from "@/lib/realtime-visitrecord";
import { Amplify } from "aws-amplify";
import { isSignedIn } from "@/lib/amplify-auth";

/**
 * アプリケーションのトップレベルで副作用（watcher の開始）を処理するコンポーネント。
 *
 * - `Amplify.configure()` の完了を検知し、`VisitRecord` モデルの observeQuery を購読開始する。
 * - GraphQL エンドポイントが未設定の場合は購読を開始せずにスキップする。
 * - クリーンアップ時に `unsubscribe()` を実行してメモリリークを防ぐ。
 *
 * @component
 * @example
 * <AppRoot />
 *
 * @returns {null} 表示要素を持たず、副作用のみ処理。
 */
export function AppRoot() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const init = async () => {
      const config = Amplify.getConfig();
      const signedIn = await isSignedIn();

      if (!config?.API?.GraphQL?.endpoint || !signedIn) {
        console.warn("未認証または未初期化のため watcher を起動しません");
        return;
      }

      if (!started) {
        const sub = startVisitRecordRealtimeWatcher();
        setStarted(true);
        return () => sub.unsubscribe();
      }
    };

    init();
  }, [started]);

  return null;
}
