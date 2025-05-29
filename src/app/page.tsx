// src/app/page.tsx
"use client";

import AttendanceManagement from "@/components/attendance-management";
import { seedVisitRecords } from "@/app/attendance/seed";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    await seedVisitRecords();
    alert("初期データ登録が完了しました");
    setSeeding(false);
  };

  return (
    <div className="space-y-4 p-4">
      {/* ✅ 本番環境含め、環境変数で表示切替 */}
      {process.env.NEXT_PUBLIC_SHOW_SEED_BUTTON === "true" && (
        <div className="flex justify-end">
          <Button onClick={handleSeed} disabled={seeding}>
            {seeding ? "登録中…" : "初期データを投入"}
          </Button>
        </div>
      )}

      <AttendanceManagement />
    </div>
  );
}
