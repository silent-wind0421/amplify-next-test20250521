// src/app/login-audit.tsx
"use client";
import { useLoginTracker } from "@/hooks/use-logintracker"

type Props = {
  user: any;
  authStatus: string;
  destination: string;
};

export default function LoginAudit({ user, authStatus, destination }: Props) {
  // ここでフックを呼ぶ（親では条件分岐し、子は常に同じ順序で呼ばれるので安全）
  useLoginTracker(user, authStatus, destination);
  return null;
}
