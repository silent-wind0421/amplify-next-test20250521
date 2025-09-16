// src/components/attendance/reason-select.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  REASON_LABEL,
  REASON_VALUES,
  toReasonCode,
  type ReasonCode,
} from "@/types/attendance";

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
  const code: ReasonCode = value ?? "0";

  return (
    <Select value={code} onValueChange={(v) => onChange(toReasonCode(v))}>
      <SelectTrigger
        onFocus={onFocus}
        onBlur={onBlur}
        className={className ?? "w-[75px] lg:w-[95px] h-7 text-xs mx-auto"}
      >
        <SelectValue placeholder="理由を選択" />
      </SelectTrigger>
      <SelectContent>
        {REASON_VALUES.map((rc) => (
          <SelectItem key={rc} value={rc}>
            {REASON_LABEL[rc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
