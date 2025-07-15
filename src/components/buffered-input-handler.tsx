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
}) => {


  //QR読み取り成功音  qr-reception-screen.tsx側に記載

//   const successAudio = useRef<HTMLAudioElement | null>(null);

//   useEffect(() => {
//     successAudio.current = new Audio("/sounds/maou_se_system23.mp3");
//     successAudio.current.preload = "auto";
//     successAudio.current.load();
//   },[]);

//   const playSuccessSound = () => {
//   if (successAudio.current) {
//     successAudio.current.currentTime = 0; // 先頭に戻す
//     successAudio.current.play().catch(console.warn);
//   }
// };

// const lastPlayTimeRef = useRef<number>(0);

// const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//   const now = Date.now();
//   if (now - lastPlayTimeRef.current > 300) {
//     playSuccessSound();
//     lastPlayTimeRef.current = now;
//   }
// };


  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  // const toHalfWidth = (str: string) =>
  //   str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
  //     String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  //   );

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

      clearTimeout(timeoutRef.current!);

      if (rawValue.includes("\n") || rawValue.includes("\r")) {
      onScanComplete(reversed);
      if (inputRef.current) inputRef.current.value = "";
    } else if (cleaned.length >= 20) {
      // ✅ 20文字以上で即時確定
      onScanComplete(cleaned);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      // それ以外はタイムアウトで処理
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

      onKeyDown={(e) => {
    // handleKeyDown?.(e); 
     onKeyDown?.(e);// ← 親から受け取った処理を呼び出す
  }}

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
