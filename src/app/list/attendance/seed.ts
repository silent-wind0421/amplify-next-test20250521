// src/app/attendance/seed.ts

/**
 * @file seed.ts
 * @description   Amplify Data Client を用いて Recipient および VisitRecord の初期データを投入する開発用ユーティリティ。
 * 
 * 利用用途：
 * - 開発/検証環境でのデータセットアップ
 * - `/components/seed-button.tsx` から呼び出される
 * 
 * ⚠️ 本番環境での使用は想定していないため、環境変数などで制御すること。
 */
"use server";

import { v4 as uuidv4 } from "uuid";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource"; //modified by yoshida
import { revalidatePath } from "next/cache";
import { configureAmplify } from "../../../../amplify/configureAmplify"; // modified by yoshida

configureAmplify();

const client = generateClient<Schema>();

/**
 * 受給者（Recipient）モデルに初期データを投入する。
 * 
 * - すでに登録済みの recipientId はスキップ。
 * - Amplify Data Client を通じて recipientId モデルへ登録。
 * 
 * @async
 * @returns {Promise<void>} 非同期で完了を返す
 */

async function seedRecipients() {
    const now = new Date().toISOString();
    const recipients = [
        { recipientId: "R001", lastName: "山田", firstName: "太郎" },
        { recipientId: "R002", lastName: "佐藤", firstName: "花子" },
        { recipientId: "R003", lastName: "鈴木", firstName: "一郎" },
        { recipientId: "R004", lastName: "田中", firstName: "美咲子" },
    ];

    for (const r of recipients) {
        const { data: found } = await client.models.Recipient.list({
            filter: { recipientId: { eq: r.recipientId } },
        });
        if (!found?.length) {
            await client.models.Recipient.create({
                recipientId: r.recipientId,
                lastName: r.lastName,
                firstName: r.firstName,
                isDeleted: false,
                createdAt: now,
                createdBy: "seed",
                guardians: [],
            });
        }
    }
}


/**
 * VisitRecord モデルに当日の初期データを投入する。
 * 
 * - 先に `seedRecipients` を実行して Recipient レコードを確保。
 * - 受給者ごとに visitDate が重複していなければ新規作成。
 * - 作成後はトップページを再検証（`revalidatePath("/")`）。
 * 
 * @async
 * @throws {Error} 初期化に失敗した場合はエラーログを出力し再送出
 * @returns {Promise<void>}
 */
export async function seedVisitRecords() {
    try {
        await seedRecipients();

        const today = new Date().toISOString().slice(0, 10); // 例: 2025-05-27

        const recipients = [
            { recipientId: "R001", plannedArrivalTime: "16:00:00", contractedDuration: 100 },
            { recipientId: "R002", plannedArrivalTime: "17:30:00", contractedDuration: 100 },
            { recipientId: "R003", plannedArrivalTime: "16:00:00", contractedDuration: 100 },
            { recipientId: "R004", plannedArrivalTime: "16:00:00", contractedDuration: 100 },
        ];

        for (const r of recipients) {
            const existing = await client.models.VisitRecord.list({
                filter: {
                    recipientId: { eq: r.recipientId },
                    visitDate: { eq: today },
                },
            });

            if (existing.data.length === 0) {
                const now = new Date().toISOString();
                await client.models.VisitRecord.create({
                    visitRecordId: uuidv4(),   // ← 主キーは visitRecordId
                    visitDate: today,
                    recipientId: r.recipientId,
                    officeId: "Osaka",         // 任意の既存 Facility.officeId を指定（開発用）
                    plannedArrivalTime: r.plannedArrivalTime,
                    contractedDuration: r.contractedDuration,
                    // optional: reason: "0",
                    isManuallyEntered: false,
                    isDeleted: false,
                    createdAt: now,
                    createdBy: "seed",
                    updatedAt: now,
                    updatedBy: "seed",
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
