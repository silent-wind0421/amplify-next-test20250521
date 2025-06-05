// src/app/page.tsx
"use client";

import AttendanceManagement from "@/components/attendance-management";
import { SeedButton } from "@/components/seed-button";

export default function AttendancePage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">通所実績管理</h1>

      {/* ✅ 本番環境のみボタン表示制御したい場合 */}
      {process.env.NEXT_PUBLIC_SHOW_SEED_BUTTON === "true" && (
        <div className="flex justify-end">
          <SeedButton />
        </div>
      )}

      <AttendanceManagement />
    </main>
  );
}
