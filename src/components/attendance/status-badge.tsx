// src/components/attendance/status-badge.tsx
import { Badge } from "@/components/ui/badge";
import type { StatusCode } from "@/types/attendance"; // ← ここから型だけ取る

type Props = { code: StatusCode };

export default function StatusBadge({ code }: Props) {
  switch (code) {
    case "0":
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          未来所
        </Badge>
      );
    case "1":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          利用中
        </Badge>
      );
    case "2":
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800">
          短時間利用
        </Badge>
      );
    case "3":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          利用完了
        </Badge>
      );
  }
}
