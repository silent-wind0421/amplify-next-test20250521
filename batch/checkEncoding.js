// checkEncoding.js
// 先頭1行(改行まで) or 最大 maxBytes を読み、BOM/UTF-8妥当性/SJISスコアで判定
// detect-encoding-lite.js (ESM)
import fs from 'fs';
import path from 'path';

function readSample(filePath, { maxBytes = 256 } = {}) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(maxBytes);
    const n = fs.readSync(fd, buf, 0, maxBytes, 0);
    const slice = buf.subarray(0, n);
    const lf = slice.indexOf(0x0A);
    if (lf >= 0) return slice.subarray(0, Math.min(lf + 1, slice.length));
    return slice;
  } finally {
    fs.closeSync(fd);
  }
}

function checkBOM(buf) {
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return { enc: 'utf8',  bom: 'UTF-8' };
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE)return { enc: 'utf16le', bom: 'UTF-16 LE' };
  if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF)return { enc: 'utf16be', bom: 'UTF-16 BE' };
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0xFE && buf[3] === 0xFF) return { enc: 'utf32be', bom: 'UTF-32 BE' };
  if (buf.length >= 4 && buf[0] === 0xFF && buf[1] === 0xFE && buf[2] === 0x00 && buf[3] === 0x00) return { enc: 'utf32le', bom: 'UTF-32 LE' };
  return null;
}

function isValidUTF8(buf) {
  let i = 0;
  while (i < buf.length) {
    const b = buf[i];
    if (b <= 0x7F) { i++; continue; }
    let need = 0;
    if (b >= 0xC2 && b <= 0xDF) need = 1;
    else if (b >= 0xE0 && b <= 0xEF) need = 2;
    else if (b >= 0xF0 && b <= 0xF4) need = 3;
    else return false;
    if (i + need >= buf.length) return false;
    for (let k = 1; k <= need; k++) if ((buf[i + k] & 0xC0) !== 0x80) return false;
    if (b === 0xE0 && buf[i + 1] < 0xA0) return false;
    if (b === 0xED && buf[i + 1] >= 0xA0) return false;
    if (b === 0xF0 && buf[i + 1] < 0x90) return false;
    if (b === 0xF4 && buf[i + 1] >= 0x90) return false;
    i += need + 1;
  }
  return true;
}

function scoreShiftJIS(buf) {
  let i = 0, okPairs = 0, badPairs = 0, hankakuKana = 0, highBytes = 0;
  while (i < buf.length) {
    const b = buf[i];
    if (b <= 0x7F) { i++; continue; }
    highBytes++;
    if (b >= 0xA1 && b <= 0xDF) { hankakuKana++; i++; continue; }
    const lead = (b >= 0x81 && b <= 0x9F) || (b >= 0xE0 && b <= 0xFC);
    if (lead) {
      if (i + 1 >= buf.length) { badPairs++; break; }
      const t = buf[i + 1];
      const trailOK = (t >= 0x40 && t <= 0x7E) || (t >= 0x80 && t <= 0xFC);
      if (trailOK && t !== 0x7F) { okPairs++; i += 2; continue; }
      badPairs++; i++; continue;
    }
    badPairs++; i++;
  }
  const totalPairs = okPairs + badPairs;
  const pairScore = totalPairs ? okPairs / totalPairs : 0;
  const kanaBonus = Math.min(hankakuKana / Math.max(highBytes, 1), 0.3);
  return pairScore + kanaBonus;
}

export function detectEncodingFromBuffer(buf) {
  const bom = checkBOM(buf);
  if (bom) return { encoding: bom.enc, bom: bom.bom, confidence: 1, reason: `BOM=${bom.bom}` };
  const utf8OK = isValidUTF8(buf);
  const sjisScore = scoreShiftJIS(buf);
  if (utf8OK && sjisScore < 0.4) return { encoding: 'utf8',  bom: null, confidence: 0.9, reason: `UTF-8 valid / SJIS ${sjisScore.toFixed(2)}` };
  if (!utf8OK && sjisScore >= 0.5) return { encoding: 'cp932', bom: null, confidence: 0.8, reason: `UTF-8 invalid / SJIS ${sjisScore.toFixed(2)}` };
  if (utf8OK && sjisScore >= 0.5)  return { encoding: 'utf8',  bom: null, confidence: 0.6, reason: `Both plausible; prefer UTF-8 (SJIS ${sjisScore.toFixed(2)})` };
  return { encoding: utf8OK ? 'utf8' : 'cp932', bom: null, confidence: 0.5, reason: `Tie; UTF-8=${utf8OK}, SJIS=${sjisScore.toFixed(2)}` };
}

export function detectEncodingFromFile(filePath, opts = {}) {
  const abs = path.resolve(filePath);
  const sample = readSample(abs, opts);
  return detectEncodingFromBuffer(sample);
}
