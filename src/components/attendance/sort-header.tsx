import { ArrowUp, ArrowDown } from "lucide-react";

export function SortHeader({
  active,
  direction,
  onClick,
  children,
  balanced = false,
}: {
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
  children: React.ReactNode;
  balanced?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap cursor-pointer select-none hover:opacity-80"
      onClick={onClick}
    >
      {/* ★ 左スペーサー（balanced のときだけ入れる） */}
      {balanced && <span className="inline-flex h-3.5 w-3.5" aria-hidden />}

      <span className="truncate">{children}</span>
      {/* 右アイコン枠は常に確保（非アクティブ時は空枠） */}
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </span>
    </span>
  );
}
