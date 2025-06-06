// src/components/seed-button.tsx
'use client';

import { useTransition } from "react";
import { seedVisitRecords } from "@/app/attendance/seed";

/**
 * SeedButton コンポーネント
 *
 * 開発用の初期データ登録ボタン。
 * - `seedVisitRecords` を非同期に呼び出して VisitRecord データを登録する。
 * - 実行中は「登録中...」と表示され、ボタンが無効化される。
 *
 * ⚠️ 本番環境では表示制御が必要。環境変数 `NEXT_PUBLIC_SHOW_SEED_BUTTON` などで制御すること。
 *
 * @component
 * @returns {JSX.Element} 初期データ登録用のボタン
 */

export function SeedButton() {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => startTransition(() => seedVisitRecords())}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded"
        >
            {isPending ? "登録中..." : "初期データ登録"}
        </button>
    );
}
