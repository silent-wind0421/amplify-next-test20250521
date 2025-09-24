import dayjs from 'dayjs';
/** 漢字・ひらがな・カタカナ + 半角スペース + 漢字・ひらがな・カタカナ */
/*export const isValidJapaneseFullName = (value) => {
    return /^[\u4E00-\u9FFFぁ-んーァ-ヶー]+ [\u4E00-\u9FFFぁ-んーァ-ヶー]+$/.test(value);
};*/


export function isValidJapaneseFullName(s) {
  if (typeof s !== 'string') return false;

  // 正規化 & スペース整形
  const v = s
    .normalize('NFC')
    .replace(/\u3000/g, ' ') // 全角スペース→半角
    .trim()
    .replace(/\s+/g, ' ');   // 連続空白を1つに

    if (!v) return false;

  // 許可文字:
  //  - 漢字（全領域・互換含む）: \p{Script=Han}
  //  - ひらがな: ぁ-ん
  //  - カタカナ: ァ-ヶ
  //  - 記号: 々(3005)

  // 許可文字: 漢字(全域)・ひらがな・カタカナ・々
    const part = String.raw`[\p{Script=Han}ぁ-んァ-ヶ\u3005]+`;
    const re = new RegExp(`^${part} ${part}$`, 'u');  // ← u フラグ必須


  // 半角ｶﾀｶﾅは禁止（必要なければ削除可）
    if (/[\uFF65-\uFF9F]/u.test(v)) return false;

    return re.test(v);
}



/** 全角カタカナ + 半角スペース + 全角カタカナ の形式チェック */
export const isFullWidthKatakanaFullName = (value) => {
    return /^[ァ-ヶー]+ [ァ-ヶー]+$/.test(value);
};


/** 全角漢字 + 半角スペース + 全角漢字 */
export const isFullWidthKanjiFullName = (value) => {
    return /^[\u4E00-\u9FFF]+ [\u4E00-\u9FFF]+$/.test(value);
};
/** 全角かな + 半角スペース + 全角かな（例: たなか はなこ） */
export const isFullWidthKanaFullName = (value) => {
    return /^[ぁ-んー]+ [ぁ-んー]+$/.test(value);
};
/** YYYY/M/D または YYYY/MM/DD の形式（厳密な日付チェックは別） */
export const isValidBirthDateFormat = (value) => {
    return validateBirthDate(value).valid;
};
export const validateBirthDate = (value) => {
    //const pattern = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
    const pattern = /^\d{4}\/([1-9]|[1-9][0-9])\/([1-9]|[1-9][0-9])$/;
    if (!pattern.test(value)) {
        return { valid: false, reason: 'format' };
    }
    const [yearStr, monthStr, dayStr] = value.split('/');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const date = dayjs(new Date(year, month - 1, day));
    if (date.year() === year &&
        date.month() === month - 1 &&
        date.date() === day) {
        return { valid: true };
    }
    else {
        return { valid: false, reason: 'invalidDate' };
    }
};
/*
export const isValidBirthDateFormat = (value: string): boolean => {

  const pattern = /^\d{4}\/([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])$/;

  if(pattern.test(value)){
    return dayjs(value, 'YYYY/M/D', true).isValid();
  }else{
    return false;
  }
};
*/
export const isValidBirthDate = (value) => {
    return dayjs(value, 'YYYY/M/D', true).isValid();
};
/** 英数字10桁 */
export const isValidRecipientId = (value) => {
    return /^[a-zA-Z0-9_-]{6,20}$/.test(value); // 任意の形式
};
/** 数字10桁のバリデーション */
export const isTenDigitNumber = (value) => {
    return /^\d{10}$/.test(value);
};
export const isDigitNumber = (value) => {
    return /^\d+$/.test(value);
};
/** 空文字、半角スペース、全角スペースのみの文字の消去*/
export const isNotEmpty = (value) => {
    if (value === null || value === undefined)
        return false;
    return value.toString().replace(/[\s\u3000]/g, '') !== '';
};

export const codePointLength = (s = '') => [...String(s)].length;

export const hasMaxLength = (max) => {
    return (s = '') => {
        return codePointLength(s) <= max;
    };
};
export const isLength = (length) => {
    return (s = '') => {
        return codePointLength(s) == length;
    };
};
