// src/app/attendance/seed.ts
"use server";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

export async function seedVisitRecords() {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const children = [
        { childId: "user001", plannedArrivalTime: "16:00", contractedDuration: 100 },
        { childId: "user002", plannedArrivalTime: "17:00", contractedDuration: 100 },
        // 必要に応じて児童を追加
    ];

    for (const child of children) {
        await client.models.VisitRecord.create({
            visitDate: today,
            childId: child.childId,
            officeId: "Osaka", // 固定 or 変数化可能
            plannedArrivalTime: child.plannedArrivalTime,
            contractedDuration: child.contractedDuration,
            actualArrivalTime: "",
            actualLeaveTime: "",
            actualDuration: 0,
            lateReasonCode: "",
            earlyLeaveReasonCode: "",
            isManuallyEntered: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            createdBy: "admin",
            updatedAt: new Date().toISOString(),
            updatedBy: "admin",
            version: 1,
            remarks: "",
        });
    }

    console.log("✅ 初期レコード登録完了");
}
