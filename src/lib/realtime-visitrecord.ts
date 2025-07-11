// src/lib/realtime-visitrecord.ts

// ✅ 遅延初期化で Amplify.configure 後に generateClient() を安全に実行
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

/**
 * クライアントのシングルトンインスタンス（遅延初期化）
 */
let clientInstance: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!clientInstance) {
    clientInstance = generateClient<Schema>({ authMode: "userPool" });
  }
  return clientInstance;
}

/**
 * VisitRecord のリアルタイム購読を開始し、変更イベントごとに処理を実行する。
 *
 * - Amplify.configure() 実行後に呼び出す必要がある。
 */
export function startVisitRecordRealtimeWatcher() {
  const client = getClient();

  const sub = client.models.VisitRecord.observeQuery().subscribe({
    next: async ({ items }) => {
      for (const record of items) {
        const { id, actualArrivalTime, actualLeaveTime, actualDuration } =
          record;
        console.log("リアルタイム更新:", {
          id,
          actualArrivalTime,
          actualLeaveTime,
          actualDuration,
        });
      }
    },
    error: (err) => {
      console.error("[observeQuery エラー]", err);
    },
  });

  return sub;
}
