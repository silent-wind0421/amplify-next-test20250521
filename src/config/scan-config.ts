// src/config/scan-config.ts

export const QR_SCAN_COOLDOWN_MINUTES = 15;  // 15分以内再スキャン禁止
export const SCAN_LOCK_DURATION_MS = 3000;   // スキャンロック解除時間
export const UI_RESET_DURATION_MS = 5000;    // メッセージリセット時間

export const SCANNER_SETTINGS = {
  reverse: false, // BUSICOMはtrue, OBZならfalse
};

export const SCAN_INPUT_FINALIZE_LEN = 10;    // 10文字で即確定のしきい値
export const SCAN_INPUT_TIMEOUT_MS = 200;    // 改行なし時の確定待ち(ms)