// src/app/attendance/seed.ts
// "use client";
"use server";

// import config from "../../amplify_outputs.json"; 
import { v4 as uuidv4 } from "uuid";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { revalidatePath } from "next/cache";
import { configureAmplify } from "../../../amplify/configureAmplify";


configureAmplify();

//確認用
console.log("------------------------");
console.log("✅ seedVisitRecords 関数実行開始");
if (process.env.NODE_ENV === "development") {
    console.log("env values", {
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        url: process.env.NEXT_PUBLIC_APPSYNC_URL,
        apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
    });
}

console.log("------------------------");


// Amplify.configure(config);
// Amplify.configure({
//     aws_project_region: process.env.NEXT_PUBLIC_AWS_REGION,
//     aws_appsync_graphqlEndpoint: process.env.NEXT_PUBLIC_APPSYNC_URL,
//     aws_appsync_region: process.env.NEXT_PUBLIC_AWS_REGION,
//     aws_appsync_authenticationType: "API_KEY",
//     aws_appsync_apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
// } as any);


const client = generateClient<Schema>();

//確認用
console.log("✅ available models:", Object.keys(client.models));
console.log("📦 client.models:", client.models);


export async function seedVisitRecords() {
    try {
        const today = new Date().toISOString().slice(0, 10); // 例: 2025-05-29

        const children = [
            { childId: "user001", plannedArrivalTime: "16:00", contractedDuration: 100 },
            { childId: "user002", plannedArrivalTime: "17:00", contractedDuration: 100 },
        ];

        for (const child of children) {
            await client.models.VisitRecord.create({
                id: uuidv4(),
                visitDate: today,
                childId: child.childId,
                officeId: "Osaka",
                plannedArrivalTime: child.plannedArrivalTime,
                contractedDuration: child.contractedDuration,
                actualArrivalTime: null,
                actualLeaveTime: null,
                actualDuration: 0,
                lateReasonCode: null,
                earlyLeaveReasonCode: null,
                isManuallyEntered: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                createdBy: "admin",
                updatedAt: new Date().toISOString(),
                updatedBy: "admin",
                version: 1,
                remarks: null,
            });
        }

        console.log("✅ 初期データ登録完了");
        revalidatePath("/"); // オプション: データ反映
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