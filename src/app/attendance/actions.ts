"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource"; // ← 相対パス推奨

const client = generateClient<Schema>();

export async function handleArrival(visitRecordId: string) {
    const now = new Date().toISOString().slice(11, 16);

    // 必要であれば事前取得（versionや他の値を再利用）
    const { data: current } = await client.models.VisitRecord.get({ id: visitRecordId });

    if (!current) {
        console.error("該当レコードが見つかりません");
        return;
    }

    await client.models.VisitRecord.update({
        id: visitRecordId,
        visitDate: current.visitDate,
        officeId: current.officeId,
        childId: current.childId,
        plannedArrivalTime: current.plannedArrivalTime,
        contractedDuration: current.contractedDuration,

        actualArrivalTime: now,
        actualLeaveTime: current.actualLeaveTime || "",
        actualDuration: current.actualDuration || 0,

        lateReasonCode: current.lateReasonCode || "",
        earlyLeaveReasonCode: current.earlyLeaveReasonCode || "",
        isManuallyEntered: true,
        isDeleted: false,

        updatedAt: new Date().toISOString(),
        updatedBy: "admin",

        version: (current.version ?? 0) + 1,
        remarks: current.remarks || "",
    });
}

export async function handleLeave(record: Schema["VisitRecord"]["type"]) {
    const now = new Date().toISOString().slice(11, 16);

    if (!record.actualArrivalTime) {
        console.error("actualArrivalTime が未入力のため退所できません");
        return;
    }

    const [h1, m1] = record.actualArrivalTime.split(":").map(Number);
    const [h2, m2] = now.split(":").map(Number);
    const duration = (h2 * 60 + m2) - (h1 * 60 + m1);

    await client.models.VisitRecord.update({
        ...record,
        actualLeaveTime: now,
        actualDuration: duration,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
        version: (record.version ?? 0) + 1,
    });
}
