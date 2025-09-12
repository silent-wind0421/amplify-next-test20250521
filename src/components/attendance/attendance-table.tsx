// src/components/attendance/attendance-table.tsx
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import type { AttendanceData } from "@/types/attendance";
import type { EditingState } from "@/hooks/use-attendance-editing";
import { SortHeader } from "@/components/attendance/sort-header";
import AttendanceRow, {
  type RowActions,
} from "@/components/attendance/attendance-row";
import type { SortColumn, SortDirection } from "@/lib/attendance-sorting";

export type SortConfig = { column: SortColumn; direction: SortDirection };

export default function AttendanceTable({
  rows,
  sort,
  onSort,
  editing,
  onStartEdit,
  onCancelEdit,
  actions,
  onChangeEditValue,
  onEditNote,
  onFocusEditing,
  onBlurEditing,
}: {
  rows: AttendanceData[];
  sort: SortConfig;
  onSort: (c: SortColumn) => void;
  editing: EditingState;
  onStartEdit: (s: EditingState) => void;
  onCancelEdit: () => void;
  actions: RowActions;
  onChangeEditValue?: (v: string | null) => void;
  onEditNote?: (id: string, current: string | null) => void;
  onFocusEditing?: () => void;
  onBlurEditing?: () => void;
}) {
  return (
    <div className="w-full rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="table-fixed w-full min-w-[1100px] text-[15px] align-middle">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px] whitespace-nowrap text-left p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  active={sort.column === "userName"}
                  direction={sort.direction}
                  onClick={() => onSort("userName")}
                >
                  児童名
                </SortHeader>
              </TableHead>
              <TableHead className="w-[90px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  balanced
                  active={sort.column === "scheduledTime"}
                  direction={sort.direction}
                  onClick={() => onSort("scheduledTime")}
                >
                  来所予定時刻
                </SortHeader>
              </TableHead>
              <TableHead className="w-[90px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  balanced
                  active={sort.column === "contractTime"}
                  direction={sort.direction}
                  onClick={() => onSort("contractTime")}
                >
                  契約利用時間
                </SortHeader>
              </TableHead>
              <TableHead className="w-[90px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  balanced
                  active={sort.column === "arrivalTime"}
                  direction={sort.direction}
                  onClick={() => onSort("arrivalTime")}
                >
                  来所時刻
                </SortHeader>
              </TableHead>
              <TableHead className="w-[90px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  balanced
                  active={sort.column === "departureTime"}
                  direction={sort.direction}
                  onClick={() => onSort("departureTime")}
                >
                  退所時刻
                </SortHeader>
              </TableHead>
              <TableHead className="w-[80px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  balanced
                  active={sort.column === "actualUsageTime"}
                  direction={sort.direction}
                  onClick={() => onSort("actualUsageTime")}
                >
                  実利用時間
                </SortHeader>
              </TableHead>
              <TableHead className="w-[80px] lg:w-[100px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                早退/超過理由
              </TableHead>
              <TableHead className="w-[70px] lg:w-[120px] whitespace-nowrap text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                備考
              </TableHead>
              <TableHead className="w-[90px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                <SortHeader
                  balanced
                  active={sort.column === "status"}
                  direction={sort.direction}
                  onClick={() => onSort("status")}
                >
                  ステータス
                </SortHeader>
              </TableHead>
              <TableHead className="w-[60px] text-center p-4 py-2 text-gray-700 font-medium tracking-wide">
                削除
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => (
              <AttendanceRow
                key={r.id}
                row={r}
                editing={editing}
                onStartEdit={onStartEdit}
                onChangeEditValue={onChangeEditValue}
                onCancelEdit={onCancelEdit}
                actions={actions}
                onEditNote={onEditNote}
                onFocusEditing={onFocusEditing}
                onBlurEditing={onBlurEditing}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
