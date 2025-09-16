// src/components/buffered-input-Handler.tsx
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  timeoutMs?: number;
  reverse?: boolean; // 反転するかどうかをオプションで指定
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
  onKeyDown,
  reverse = false, // デフォルトは反転しない
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toHalfWidth = (str: string): string => {
    return str
      .replace(/[\uFF01-\uFF5E]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
      ) // 一般的な全角記号・英数
      .replace(/\u3000/g, " "); // 全角スペースを半角スペースに
  };

  /**
   * 入力イベントの処理関数。
   * 入力文字列を整形し、必要に応じてタイムアウトで確定処理を行う。
   *
   * @param {React.FormEvent<HTMLInputElement>} e - 入力イベント。
   */

  // const handlKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   const now = Date.now();
  //   if (e.key) {
  //     // playBeep();
  //     //lastPlayTimeRef.current = now;
  //   }
  // };

  //QRコード読み取り時
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
      const processedValue = reverse ? reversed : cleaned; // オプションで切り替え

      clearTimeout(timeoutRef.current!);

      if (rawValue.includes("\n") || rawValue.includes("\r")) {
        // playBeep(); // 即ビープ音
        onScanComplete(processedValue);
        if (inputRef.current) inputRef.current.value = "";
      } else if (cleaned.length >= 20) {
        // 20文字に達したら即確定
        // playBeep();
        onScanComplete(processedValue);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        clearTimeout(timeoutRef.current!);
        timeoutRef.current = setTimeout(() => {
          // playBeep(); // タイムアウト後ビープ
          onScanComplete(processedValue);
          if (inputRef.current) inputRef.current.value = "";
        }, timeoutMs);
      }
    },
    [onScanComplete, timeoutMs, reverse]
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
      // onKeyDown={(e) => {
      //   onKeyDown?.(e);
      // }}
      type="text"
      // onKeyDown={handlKeydown}
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
