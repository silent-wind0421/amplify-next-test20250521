import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X as XIcon, Edit2 } from "lucide-react";
import { normalizeToHHmm } from "@/lib/utils";

type Props = {
  value: string | null; // 表示用（例 "02:30"）
  isEditing: boolean; // 編集中かどうか
  editingValue: string; // 入力中の値（テキスト）
  onStartEdit: (current: string) => void; // 編集開始（現値を渡す）
  onChange: (v: string) => void; // 入力変更
  onSave: () => void; // 保存
  onCancel: () => void; // キャンセル
  onFocus?: () => void; // 任意: 編集中フラグなど
  onBlur?: () => void; // 任意
};

export default function ContractTimeCell({
  value,
  isEditing,
  editingValue,
  onStartEdit,
  onChange,
  onSave,
  onCancel,
  onFocus,
  onBlur,
}: Props) {
  if (!isEditing) {
    return (
      <div className="group grid grid-cols-[1.5rem_auto_1.5rem] items-center w-full">
        <span aria-hidden />
        <span className="justify-self-center inline-block w-14 text-center font-mono tabular-nums">
          {value ?? "-"}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="justify-self-end h-6 w-6 rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 ml-2"
          onClick={() => onStartEdit(value ?? "")}
          title="編集"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Input
        value={editingValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={(e) => {
          onChange(normalizeToHHmm(e.target.value)); // 既存と同じ onBlur 正規化
          onBlur?.();
        }}
        className="w-20 text-center text-sm"
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
        className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        onClick={onCancel}
        title="キャンセル"
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
