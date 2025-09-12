import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X as XIcon, Trash2, Edit2 } from "lucide-react";
import { formatTimeJST } from "@/lib/utils";

type Props = {
  hasArrival: boolean; // 来所済みか（退所ボタン出す条件）
  time: Date | null;
  isEditing: boolean;
  editingValue: string;
  onStartEdit: (current: string) => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClickDeparture: () => void; // 「退所」ボタン
};

export default function DepartureTimeCell({
  hasArrival,
  time,
  isEditing,
  editingValue,
  onStartEdit,
  onChange,
  onSave,
  onReset,
  onCancel,
  onFocus,
  onBlur,
  onClickDeparture,
}: Props) {
  // 来所済みだが退所していない：退所ボタン
  if (!time && hasArrival) {
    return (
      <div className="flex justify-center">
        <Button
          size="sm"
          onClick={onClickDeparture}
          className="bg-blue-500 hover:bg-blue-600 px-2 h-7 text-xs"
        >
          退所
        </Button>
      </div>
    );
  }

  // 来所も未設定なら空
  if (!time) return null;

  // 編集中
  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1 mx-auto">
        <Input
          value={editingValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-20 text-sm text-center"
          placeholder="HH:mm"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={onSave}
          title="保存"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
          onClick={onReset}
          title="時刻をリセット"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          onClick={onCancel}
          title="キャンセル"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // 表示モード
  return (
    <div className="group grid grid-cols-[1.5rem_auto_1.5rem] items-center w-full">
      <span aria-hidden />
      <span className="justify-self-center inline-block w-16 text-center tabular-nums whitespace-nowrap font-medium text-gray-700">
        {formatTimeJST(time)}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="justify-self-end h-6 w-6 rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 ml-2"
        onClick={() => onStartEdit(formatTimeJST(time) || "")}
        title="編集"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
