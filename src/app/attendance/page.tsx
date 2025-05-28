//src/app/attendance/page.tsx

'use client';

import AttendanceTable from '@/components/AttendanceTable';

export default function AttendancePage() {
    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">通所実績管理</h1>
            <AttendanceTable />
        </main>
    );
}
