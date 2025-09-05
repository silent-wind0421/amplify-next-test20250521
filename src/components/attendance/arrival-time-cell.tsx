import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X as XIcon, Trash2, Edit2 } from "lucide-react";
import { formatTimeJST } from "@/lib/utils";

type Props = {
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
  onClickArrival: () => void; // 「来所」ボタン
};

export default function ArrivalTimeCell({
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
  onClickArrival,
}: Props) {
  // まだ来所していないとき：来所ボタン
  if (!time) {
    return (
      <div className="flex justify-center">
        <Button
          size="sm"
          onClick={onClickArrival}
          className="bg-blue-500 hover:bg-blue-600 px-2 h-7 text-xs"
        >
          来所
        </Button>
      </div>
    );
  }

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
      <span className="justify-self-center inline-block w-14 text-center font-mono tabular-nums font-medium text-gray-700">
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
