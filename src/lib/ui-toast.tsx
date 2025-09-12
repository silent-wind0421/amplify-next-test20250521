// src/lib/ui-toast.tsx
"use client";
import { toast } from "sonner";
import { Message } from "@/components/common/message";

// static string だけをキー型として抽出
type MessageKey = {
  [K in keyof typeof Message]: (typeof Message)[K] extends string ? K : never;
}[keyof typeof Message];

type MaybeKey = string | MessageKey | undefined;

// class の static を素直に見るため any テーブル化
const MSG: Record<string, string> = Message as unknown as Record<
  string,
  string
>;

// キーなら辞書から文字列に、文字列ならそのまま
const resolve = (v: MaybeKey): string | undefined => {
  if (v == null) return undefined;
  return MSG[v] ?? String(v);
};

/** successToast
 *  - 1引数: 説明だけ（タイトルはデフォルト "保存しました"(IC000002)）
 *      successToast("来所を記録しました") / successToast("IA000001")
 *  - 2引数: タイトル + { description }
 *      successToast("IC000002", { description: "IA000001" })
 */
export function successToast(desc?: MaybeKey): void;
export function successToast(
  title: MaybeKey,
  opts?: { description?: MaybeKey }
): void;
export function successToast(a?: MaybeKey, b?: { description?: MaybeKey }) {
  const hasOpts = typeof b === "object" && b !== null;
  const defaultTitle = resolve("IC000002") ?? "保存しました";
  const title = hasOpts ? (resolve(a) ?? defaultTitle) : defaultTitle;
  const description = hasOpts ? resolve(b?.description) : resolve(a);
  toast.success(title!, description ? { description } : undefined);
}

/** errorToast
 *  - 0引数: 既定(EF050021/EF050020)
 *  - 1引数: タイトルだけ上書き
 *  - 2引数: タイトル + { description }
 */
export function errorToast(): void;
export function errorToast(title: MaybeKey): void;
export function errorToast(
  title: MaybeKey,
  opts: { description?: MaybeKey }
): void;
export function errorToast(a?: MaybeKey, b?: { description?: MaybeKey }) {
  const t = resolve(a ?? "EF050021")!; // "DynamoDBの保存エラーが発生しました。"
  const d = resolve(b?.description ?? "EF050020"); // "DynamoDBへの保存に失敗しました。"
  toast.error(t, d ? { description: d } : undefined);
}
