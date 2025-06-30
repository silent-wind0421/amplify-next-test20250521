// src/component/app-root.tsx
"use client";

import { useEffect, useState } from "react";
import { startVisitRecordRealtimeWatcher } from "@/lib/realtime-visitrecord";
import { Amplify } from "aws-amplify";

/**
 * アプリケーション全体で最上位に配置されるユーティリティコンポーネント。
 *
 * - Amplify の GraphQL エンドポイント設定が完了していることを検知し、
 *   `VisitRecord` モデルの observeQuery を購読開始する。
 * - `Amplify.configure()` が未完了の状態では起動せず、安全にスキップする。
 * - 再レンダリング時にも一度だけ購読を開始し、クリーンアップも行う。
 *
 * このコンポーネントは UI を返さず、ただ副作用を管理するために存在する。
 *
 * @component
 * @example
 * ```tsx
 * <AppRoot />
 * ```
 */
export function AppRoot() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const config = Amplify.getConfig();

    // Amplify.configure() の完了を確認
    if (!config?.API?.GraphQL?.endpoint) {
      console.warn(
        "Amplify.configure() がまだ完了していないため、watcher を起動しません"
      );
      return;
    }

    // 一度だけ watcher を開始
    if (!started) {
      const sub = startVisitRecordRealtimeWatcher();
      setStarted(true);
      return () => sub.unsubscribe(); // クリーンアップ
    }
  }, [started]);

  return null;
}
