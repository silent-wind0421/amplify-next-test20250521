// src/components/attendance/attendance-row.tsx
import type { AttendanceData, StatusCode } from "@/types/attendance";
import ArrivalTimeCell from "@/components/attendance/arrival-time-cell";
import DepartureTimeCell from "@/components/attendance/departure-time-cell";
import ContractTimeCell from "@/components/attendance/contract-time-cell";
import ReasonSelect from "@/components/attendance/reason-select";
import StatusBadge from "@/components/attendance/status-badge";
import type { EditingState } from "@/hooks/use-attendance-editing";
import { Trash2 } from "lucide-react";

export type RowActions = {
  handleArrival: (id: string) => Promise<unknown>;
  handleDeparture: (id: string) => Promise<unknown>;
  saveEditedTime: (
    id: string,
    kind: "arrival" | "departure",
    value: string
  ) => Promise<unknown>;
  resetTime: (id: string, kind: "arrival" | "departure") => Promise<unknown>;
  handleSaveContract: (id: string, hhmm: string | null) => Promise<unknown>;
  handleSaveReason: (id: string, code: any | null) => Promise<unknown>;
  handleSaveNote: (id: string, note: string | null) => Promise<unknown>;
  deleteRow: (row: AttendanceData) => Promise<unknown>; // ★ 追加
};

export default function AttendanceRow({
  row,
  editing,
  onStartEdit,
  onChangeEditValue,
  onCancelEdit,
  actions,
  onEditNote,
  onFocusEditing,
  onBlurEditing,
}: {
  row: AttendanceData;
  editing: EditingState | null;
  onStartEdit: (s: EditingState) => void;
  onChangeEditValue?: (v: string | null) => void;
  onCancelEdit: () => void;
  actions: RowActions;
  onEditNote?: (id: string, current: string | null) => void;
  onFocusEditing?: () => void;
  onBlurEditing?: () => void;
}) {
  const isEditingThis = editing?.id === row.id;
  const editingValue = editing?.value ?? "";
  const _onChange = onChangeEditValue ?? (() => {});

  const isContractEditing = isEditingThis && editing?.type === "contract";
  const isArrivalEditing = isEditingThis && editing?.type === "arrival";
  const isDepartureEditing = isEditingThis && editing?.type === "departure";

  return (
    <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 border-b border-gray-200 last:border-0 transition-colors">
      {/* 児童名 */}
      <td className="whitespace-nowrap px-4 py-3 text-left align-middle">
        {row.userName}
      </td>

      {/* 来所予定時刻 */}
      <td>
        <div className="mx-auto w-16 text-center tabular-nums whitespace-nowrap">
          {row.scheduledTime || "-"}
        </div>
      </td>

      {/* 契約利用時間 */}
      <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
        <ContractTimeCell
          value={row.contractTime}
          isEditing={!!isContractEditing}
          editingValue={
            isContractEditing ? editingValue : (row.contractTime ?? "")
          }
          onStartEdit={(current) =>
            onStartEdit({ id: row.id, type: "contract", value: current })
          }
          onChange={(v) => _onChange(v)}
          onSave={() => {
            void actions.handleSaveContract(row.id, editingValue || null);
            onCancelEdit();
          }}
          onCancel={onCancelEdit}
        />
      </td>

      {/* 来所時刻 */}
      <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
        <ArrivalTimeCell
          time={row.arrivalTime}
          isEditing={!!isArrivalEditing}
          editingValue={isArrivalEditing ? editingValue : ""}
          onStartEdit={(current) =>
            onStartEdit({ id: row.id, type: "arrival", value: current })
          }
          onChange={(v) => _onChange(v)}
          onSave={() => {
            void actions.saveEditedTime(row.id, "arrival", editingValue);
            onCancelEdit();
          }}
          onReset={() => {
            void actions.resetTime(row.id, "arrival");
            onCancelEdit();
          }}
          onCancel={onCancelEdit}
          onClickArrival={() => {
            void actions.handleArrival(row.id);
          }}
        />
      </td>

      {/* 退所時刻 */}
      <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
        <DepartureTimeCell
          hasArrival={!!row.arrivalTime}
          time={row.departureTime}
          isEditing={!!isDepartureEditing}
          editingValue={isDepartureEditing ? editingValue : ""}
          onStartEdit={(current) =>
            onStartEdit({ id: row.id, type: "departure", value: current })
          }
          onChange={_onChange}
          onSave={() => {
            void actions.saveEditedTime(row.id, "departure", editingValue);
            onCancelEdit();
          }}
          onReset={() => {
            void actions.resetTime(row.id, "departure");
            onCancelEdit();
          }}
          onCancel={onCancelEdit}
          onClickDeparture={() => {
            void actions.handleDeparture(row.id);
          }}
        />
      </td>

      {/* 実利用時間 */}
      <td>
        <div className="mx-auto w-16 text-center tabular-nums whitespace-nowrap">
          {row.actualUsageTime ?? "-"}
        </div>
      </td>

      {/* 早退/超過理由 */}
      <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
        <ReasonSelect
          value={row.reason}
          onChange={(code) => void actions.handleSaveReason(row.id, code)}
          onFocus={onFocusEditing}
          onBlur={onBlurEditing}
        />
      </td>

      {/* 備考 */}
      <td className="px-4 py-3 text-left align-middle w-[12rem]">
        <button
          type="button"
          className="h-8 w-full truncate rounded-md border border-gray-300 bg-white px-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          onClick={() => onEditNote?.(row.id, row.note)}
          title={row.note ?? ""}
        >
          {row.note ? row.note : <span className="text-gray-400">-</span>}
        </button>
      </td>

      {/* ステータス */}
      <td>
        <div className="flex justify-center">
          <StatusBadge code={(row.status ?? "0") as StatusCode} />
        </div>
      </td>

      {/* 削除 */}
      <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
        <button
          type="button"
          title="この行を削除"
          aria-label="この行を削除"
          onClick={() => void actions.deleteRow(row)}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
