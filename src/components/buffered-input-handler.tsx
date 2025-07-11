// src/components/BufferedInputHandler.tsx
"use client";

import React, { useEffect, useRef, useCallback } from "react";

/**
 * BufferedInputHandler コンポーネントのプロパティ型定義。
 *
 * @typedef {Object} Props
 * @property {(value: string) => void} onScanComplete - スキャン完了時に呼び出されるコールバック関数。
 * @property {number} [timeoutMs=500] - 改行が含まれない入力に対し、スキャン完了と見なすまでの待機時間（ミリ秒）。
 */
type Props = {
  onScanComplete: (value: string) => void;
  timeoutMs?: number;
};

/**
 * 隠れたテキストフィールドを使ってバーコードやQRコードスキャナからの入力を検出し、
 * 入力が完了したと判断されたタイミングで `onScanComplete` を呼び出すコンポーネント。
 *
 * - 入力文字列から改行を除去し、左右反転させたうえで処理（逆順は一部スキャナ対策）。
 * - 改行を含む場合は即時確定、それ以外は一定時間後に確定。
 * - 自動でフォーカスを維持し、ユーザーの操作を不要に。
 *
 * @component
 * @param {Props} props - コンポーネントのプロパティ。
 * @returns {JSX.Element} 不可視のテキスト入力フィールド。
 */
const BufferedInputHandler: React.FC<Props> = ({
  onScanComplete,
  timeoutMs = 500,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toHalfWidth = (str: string) =>
    str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    );

  /**
   * 入力イベントの処理関数。
   * 入力文字列を整形し、必要に応じてタイムアウトで確定処理を行う。
   *
   * @param {React.FormEvent<HTMLInputElement>} e - 入力イベント。
   */
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const rawValue = e.currentTarget.value;

      // 全体整形
      const cleaned = toHalfWidth(
        rawValue
          .replace(/[\n\r]/g, "")
          .trim()
          .normalize("NFKC")
      );
      const reversed = cleaned.split("").reverse().join(""); // QRスキャナ逆転対策

      if (rawValue.includes("\n") || rawValue.includes("\r")) {
        onScanComplete(reversed);
        if (inputRef.current) inputRef.current.value = "";
        clearTimeout(timeoutRef.current!);
      } else {
        clearTimeout(timeoutRef.current!);
        timeoutRef.current = setTimeout(() => {
          onScanComplete(cleaned);
          if (inputRef.current) inputRef.current.value = "";
        }, timeoutMs);
      }
    },
    [onScanComplete, timeoutMs]
  );
  /**
   * コンポーネントマウント時にフォーカス維持用のタイマーを設定。
   * スキャナ入力が常に受け付けられるよう、500msごとにフォーカスをチェックする。
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      onInput={handleInput}
      autoComplete="off"
      inputMode="none"
      lang="en"
      tabIndex={-1}
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: "none",
        zIndex: -1,
        imeMode: "disabled",
      }}
    />
  );
};

export default BufferedInputHandler;
