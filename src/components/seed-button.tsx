// src/components/seed-button.tsx
'use client';

import { useTransition } from "react";
import { seedVisitRecords } from "@/app/attendance/seed";

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
