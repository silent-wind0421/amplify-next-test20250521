// src/lib/ui-toast.tsx
"use client";
import { toast } from "sonner";

export const successToast = (
  title: string,
  opts?: { description?: string }
) => {
  toast.success(title, opts);
};

export const errorToast = (
  title: string = "エラーが発生しました",
  opts?: { description?: string }
) => {
  toast.error(title, opts);
};
