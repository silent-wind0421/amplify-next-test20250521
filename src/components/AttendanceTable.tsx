"use client";

import { useEffect, useState, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { handleArrival, handleLeave } from "@/app/attendance/actions";
import { Button } from "@/components/ui/button";

const client = generateClient<Schema>();

export default function AttendanceTable() {
    const [records, setRecords] = useState<Schema["VisitRecord"]["type"][]>([]);

    const fetchRecords = useCallback(async () => {
        const { data } = await client.models.VisitRecord.list({
            filter: { visitDate: { eq: "2025-05-28" } }, // 仮の日付
        });
        setRecords(data);
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const onArrival = async (id: string) => {
        await handleArrival(id);
        await fetchRecords(); // ← 更新後に再取得
    };

    const onLeave = async (record: Schema["VisitRecord"]["type"]) => {
        await handleLeave(record);
        await fetchRecords(); // ← 更新後に再取得
    };

    return (
        <table className="w-full border border-gray-200">
            <thead className="bg-gray-100 text-left">
                <tr>
                    <th className="p-2">児童ID</th>
                    <th className="p-2">来所予定</th>
                    <th className="p-2">来所時刻</th>
                    <th className="p-2">退所時刻</th>
                    <th className="p-2">操作</th>
                </tr>
            </thead>
            <tbody>
                {records.map((record) => (
                    <tr key={record.id} className="border-t border-gray-100">
                        <td className="p-2">{record.childId}</td>
                        <td className="p-2">{record.plannedArrivalTime}</td>
                        <td className="p-2">{record.actualArrivalTime}</td>
                        <td className="p-2">{record.actualLeaveTime}</td>
                        <td className="p-2 space-x-2">
                            <Button variant="outline" onClick={() => onArrival(record.id)}>
                                来所
                            </Button>
                            <Button variant="outline" onClick={() => onLeave(record)}>
                                退所
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
