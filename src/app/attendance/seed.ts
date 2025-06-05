// src/app/attendance/seed.ts
"use server";

import { v4 as uuidv4 } from "uuid";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { revalidatePath } from "next/cache";
import { configureAmplify } from "../../../amplify/configureAmplify";

configureAmplify();

const client = generateClient<Schema>();

// ✅ Child データも登録
async function seedChildren() {
    const children = [
        { childId: "C001", lastName: "山田", firstName: "太郎" },
        { childId: "C002", lastName: "佐藤", firstName: "花子" },
        { childId: "C003", lastName: "鈴木", firstName: "一郎" },
        { childId: "C004", lastName: "田中", firstName: "美咲子" },
    ];

    for (const child of children) {
        const existing = await client.models.Child.get({ childId: child.childId });
        if (!existing.data) {
            await client.models.Child.create(child);
        }
    }
}

export async function seedVisitRecords() {
    try {
        // ✅ Childを先に登録
        await seedChildren();

        const today = new Date().toISOString().slice(0, 10); // 例: 2025-05-27

        const children = [
            { childId: "C001", plannedArrivalTime: "16:00:00", contractedDuration: 100 },
            { childId: "C002", plannedArrivalTime: "17:30:00", contractedDuration: 100 },
            { childId: "C003", plannedArrivalTime: "16:00:00", contractedDuration: 100 },
            { childId: "C004", plannedArrivalTime: "16:00:00", contractedDuration: 100 },
        ];

        for (const child of children) {
            const existing = await client.models.VisitRecord.list({
                filter: {
                    childId: { eq: child.childId },
                    visitDate: { eq: today },
                },
            });

            if (existing.data.length === 0) {
                await client.models.VisitRecord.create({
                    id: uuidv4(),
                    visitDate: today,
                    childId: child.childId,
                    officeId: "Osaka",
                    plannedArrivalTime: child.plannedArrivalTime,
                    contractedDuration: child.contractedDuration,
                    actualArrivalTime: undefined,
                    actualLeaveTime: undefined,
                    actualDuration: undefined,
                    lateReasonCode: undefined,
                    earlyLeaveReasonCode: undefined,
                    isManuallyEntered: false,
                    isDeleted: false,
                    createdAt: new Date().toISOString(),
                    createdBy: "admin",
                    updatedAt: new Date().toISOString(),
                    updatedBy: "admin",
                    version: 1,
                    remarks: undefined,
                });
            }
        }

        console.log("✅ 初期データ登録完了");
        revalidatePath("/"); // データ反映のため
    } catch (err) {
        console.error("❌ seedVisitRecords failed:");
        if (err instanceof Error) {
            console.error("message:", err.message);
            console.error("stack:", err.stack);
        } else {
            console.error("raw error:", JSON.stringify(err));
        }
        throw new Error("初期データ登録に失敗しました");
    }
}
