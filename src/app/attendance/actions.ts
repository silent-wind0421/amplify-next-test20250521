//src/app/attendance/actions.ts

"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource"; // ← 相対パス推奨

const client = generateClient<Schema>();

export async function handleArrival(visitRecordId: string) {
    const now = new Date();
    const hhmm = now.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const { data: current } = await client.models.VisitRecord.get({ id: visitRecordId });

    if (!current) {
        console.error("該当レコードが見つかりません");
        return;
    }

    const { data, errors } = await client.models.VisitRecord.update({
        id: visitRecordId,
        visitDate: current.visitDate,
        officeId: current.officeId,
        childId: current.childId,
        plannedArrivalTime: current.plannedArrivalTime,
        contractedDuration: current.contractedDuration,

        actualArrivalTime: hhmm,
        actualLeaveTime: current.actualLeaveTime || "",
        actualDuration: 0, // ← duration は不要、初期値でOK

        lateReasonCode: current.lateReasonCode || "",
        earlyLeaveReasonCode: current.earlyLeaveReasonCode || "",
        isManuallyEntered: true,
        isDeleted: false,

        updatedAt: now.toISOString(),
        updatedBy: "admin",

        version: (current.version ?? 0) + 1,
        remarks: current.remarks || "",
    });

    if (errors) {
        console.error("来所時の更新エラー:", errors);
    } else {
        console.log("来所時の更新成功:", data);
    }
}


export async function handleLeave(record: Schema["VisitRecord"]["type"]) {
    const now = new Date();
    const hhmm = now.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    if (!record.actualArrivalTime) {
        console.error("actualArrivalTime が未入力のため退所できません");
        return;
    }

    const [h1, m1] = record.actualArrivalTime.split(":").map(Number);
    const [h2, m2] = hhmm.split(":").map(Number);
    const duration = h2 * 60 + m2 - (h1 * 60 + m1);

    const { data, errors } = await client.models.VisitRecord.update({
        id: record.id,
        visitDate: record.visitDate,
        officeId: record.officeId,
        childId: record.childId,
        plannedArrivalTime: record.plannedArrivalTime,
        contractedDuration: record.contractedDuration,
        actualArrivalTime: record.actualArrivalTime,
        actualLeaveTime: hhmm,
        actualDuration: Math.max(duration, 0),
        lateReasonCode: record.lateReasonCode || "",
        earlyLeaveReasonCode: record.earlyLeaveReasonCode || "",
        isManuallyEntered: true,
        isDeleted: false,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
        version: (record.version ?? 0) + 1,
        remarks: record.remarks || "",
    });

    if (errors) {
        console.error("退所時の更新エラー:", errors);
    } else {
        console.log("退所時の更新成功:", data);
    }
}
