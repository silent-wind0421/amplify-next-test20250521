// src/components/attendance/reason-select.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReasonCode = "0" | "1" | "2" | "3" | "99";

const REASON_LABEL: Record<ReasonCode, string> = {
  "0": "未選択",
  "1": "児童都合",
  "2": "保護者都合",
  "3": "事業者都合",
  "99": "その他",
};

type Props = {
  value: ReasonCode | null | undefined;
  onChange: (code: ReasonCode) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
};

export default function ReasonSelect({
  value,
  onChange,
  onFocus,
  onBlur,
  className,
}: Props) {
  const code = (value ?? "0") as ReasonCode;

  return (
    <Select value={code} onValueChange={(v) => onChange(v as ReasonCode)}>
      <SelectTrigger
        onFocus={onFocus}
        onBlur={onBlur}
        className={className ?? "w-[75px] lg:w-[95px] h-7 text-xs mx-auto"}
      >
        <SelectValue placeholder="理由を選択">{REASON_LABEL[code]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0">未選択</SelectItem>
        <SelectItem value="1">児童都合</SelectItem>
        <SelectItem value="2">保護者都合</SelectItem>
        <SelectItem value="3">事業者都合</SelectItem>
        <SelectItem value="99">その他</SelectItem>
      </SelectContent>
    </Select>
  );
}
