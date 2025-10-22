import fs from 'fs';
import csv from 'csv-parser';
import pLimit from 'p-limit';
import { Message } from "./message.js";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from "@aws-sdk/util-dynamodb";
import logger from './logger.js';
import { isNotEmpty, hasMaxLength, isLength, isDigitNumber, isValidJapaneseFullName, isFullWidthKatakanaFullName, isValidBirthDateFormat, validateBirthDate } from './validators.js';
import { ErrorMessages } from './errorMessages.js';
const fname = './dat/kaipoke-sample-dummy2.csv';
//const fname = './dat/20250901_recipients.csv';
// const tblname = 'UserRecipientProfiles-5ejheuwxlbbuznsn3hos2h2nie-NONE';
const tblname = 'Recipient-w2lhetvno5dzzmo5cdnmbakcwm-NONE';
const reg = 'ap-northeast-1';
//const tblname = 'User-neko2222';
const ddbClient = new DynamoDBClient({ region: reg });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const es_header = ['uname', 'uname_kana', 'id', 'cname', 'cname_kana', 'birthdate'];
const requiredIndices = [0, 1, 5, 9, 10, 12]; // チェック対象の列番号
const originalHeader = ['利用者名', '利用者カナ', '受給者証番号', '障害児名', '障害児カナ', '障害児生年月日'];
const validationsIndices = [0, 1, 2, 0, 1, 3];
const sizeValidationsIndices = [0, 0, 1, 0, 0, 0];
const maxSizeValidationsIndices = [255, 255, 10, 255, 255, 10];
//const commonErrorMsgIndices = [0, 2, 1]; 
const individualErrorMsgIndices = [3, 3, 4, 3, 3, 5];
const validations = [
    (v) => isValidJapaneseFullName(v),
    (v) => isFullWidthKatakanaFullName(v),
    (v) => isDigitNumber(v),
    (v) => isValidBirthDateFormat(v)
];
const sizeValidations = [
    hasMaxLength,
    isLength
];
/*
const errorMessages: Array<() => string> = [
  () => ErrorMessages.emptyError(),
  () => ErrorMessages.invalid(),
  () => ErrorMessages.sizeError(),
  () => ErrorMessages.invalidFormatted(),
  () => ErrorMessages.invalidDateFormatted(),
  () => ErrorMessages.invalidTenNumber()
];*/
const errorMessages = [
    ErrorMessages.emptyError(),
    ErrorMessages.invalid(),
    ErrorMessages.sizeError(),
    ErrorMessages.invalidFormatted(),
    ErrorMessages.invalidNumber(),
    ErrorMessages.invalidDateFormatted(),
    ErrorMessages.invalidDate()
];
/*
const errorMessages: Array<() => boolean> = [
  ()=> emptyError,
  ()=> invalid,
  ()=> sizeError,
  ()=> invalidFormatted,
  ()=> invalidDateFormatted,
  ()=> invalidNumber
];*/
let headerKeys = [];
function isConditionalCheckError(err) {
    const errors = err?.response?.data?.errors;
    if (!errors || !Array.isArray(errors))
        return false;
    return errors.some((e) => e.errorType === 'DynamoDB:ConditionalCheckFailedException');
}
function chunkArray(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, (i + 1) * size));
}
function buildUpdatedInput(input) {
    return {
        ...input,
        version: (input.version ?? 0) + 1,
        //updatedBy: 'system',  // もし updatedBy も更新したいなら入れる
    };
}
async function retryUnprocessedItems(unprocessedItems, maxRetries = 5, delayMs = 200) {
    let retries = 0;
    let currentItems = unprocessedItems;
    while (retries < maxRetries && Object.keys(currentItems ?? {}).length > 0) {
        await new Promise(res => setTimeout(res, delayMs * (retries + 1))); // exponential backoff
        const retryCommand = new BatchWriteCommand({ RequestItems: currentItems });
        const retryResp = await docClient.send(retryCommand);
        currentItems = retryResp.UnprocessedItems || {};
        retries++;
    }
    if (Object.keys(currentItems ?? {}).length > 0) {
        const failedPKs = [];
        for (const tblname in currentItems) {
            const requests = currentItems[tblname];
            for (const request of requests) {
                const item = request.PutRequest?.Item;
                if (item && item.recipientId && typeof item.recipientId.S === 'string') {
                    failedPKs.push(item.recipientId.S);
                }
            }
        }
        logger.error({
            message: ErrorMessages.dbUpsertError(),
            recipientIds: failedPKs,
            unprocessedItems
        });
    }
    else {
        console.log('✅ リトライ成功: すべての項目が書き込まれました');
    }
}

async function writeToDynamoDB(items) {

    const chunks = chunkArray(items, 25);
    
    for (const batch of chunks) {
        
        const putRequests = batch.map(item => ({
            PutRequest: { Item: marshall(item) }
        }));
        
        const cmd = new BatchWriteCommand({
            RequestItems: { [tblname]: putRequests }
        });
        
        const resp = await docClient.send(cmd);
        
        if (resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length) {
            console.warn('⚠️ リトライ開始');
            await retryUnprocessedItems(resp.UnprocessedItems);
        }
    }
}

const inputMap = new Map();

async function addTimestampsToItems(docClient, tableName, items) {
    // const now = new Date().toISOString();
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // JST
    const jst_now = jst.toISOString();
    const chunks = chunkArray(items, 100); // 100件ずつに分割
    const existingMap = new Map();
    for (const chunk of chunks) {
        const keys = chunk.map(item => ({ recipientId: item.recipientId }));
        try {
            const batchGetCommand = new BatchGetCommand({
                RequestItems: {
                    [tableName]: { Keys: keys }
                }
            });
            const existingData = await docClient.send(batchGetCommand);
            const existingItems = existingData.Responses?.[tableName] ?? [];
            for (const existingItem of existingItems) {
                existingMap.set(existingItem.recipientId, existingItem);
            }
        }
        catch (error) {
            // ✅ 致命的エラーとしてログ出力
            logger.error({
                message: ErrorMessages.dbConnectionError(),
                error,
                tableName,
                keys,
            });
            console.error(Message.EB050008)
            //console.error('DynamoDBの接続に失敗しました。');
            // ✅ 処理停止
            process.exit(1);
        }
    }
    return items.map(item => {
        const existing = existingMap.get(item.recipientId);
        return {
            ...item,
            version: (existing?.version ?? 0) + 1,
            createdAt: existing?.createdAt ?? jst_now,
            updatedAt: jst_now,
        };
    });
}
const headerMap = {};
let rowIndex = 1;
const rowsWithMeta = [];
//const mappedRow: Record<string, string> = {};
const indexValidationMap = {};
const indexSizeValidationMap = {};
const indexErrorMessageMap = {};
const indexMaxSizeMap = {};
const fixedValidator = isNotEmpty;
// BOM除去関数
const stripBOM = (value) => typeof value === 'string' ? value.replace(/^\uFEFF/, '') : value;
async function processCSV(filePath) {
    const inputMap = new Map();
    let headerKeys = [];
    return new Promise((resolve, reject) => {
        /*try
        {*/
        fs.createReadStream(filePath, { encoding: 'utf8' })
            .on('error', (err) => {
            console.error('ファイル読み込みエラー:', err.message);
            logger.error({
                message: ErrorMessages.fileNotFound(),
                stack: err.stack,
                source: 'CsvToDynamodbBatch.ts',
            });
        })
            .pipe(csv())
            .on('headers', (headers) => {
            headers.forEach((header, index) => {
                headers[index] = stripBOM(header);
            });
            try {
                requiredIndices.forEach((index, i) => {
                    const header = headers[index].trim();
                    console.log(header);
                    if (header == originalHeader[i]) {
                        headerMap[index] = es_header[i]; // DB用のカラム名に変換
                    }
                    else {
                        logger.error({
                            message: ErrorMessages.headerError(),
                            不正な列番号: index + 1,
                            不正な項目名: header,
                            context: 'CSVヘッダー検証'
                        });
                        throw new Error(Message.EB050010.replace("{0}", String(index)));
                        //throw new Error(`❌ 列インデックス ${index} に有効なヘッダーが存在しません`);
                    }
                    indexValidationMap[index] = validations[validationsIndices[i]];
                    indexMaxSizeMap[index] = maxSizeValidationsIndices[i];
                    indexSizeValidationMap[index] = sizeValidations[sizeValidationsIndices[i]](indexMaxSizeMap[index]);
                    indexErrorMessageMap[index] = individualErrorMsgIndices[i];
                });
                headerKeys = headers.map((h) => h.trim());
            }
            catch (err) {
                if (err instanceof Error) {
                    console.error('項目読み込みエラー:', err.message);
                    logger.error('CSVヘッダー検証中に例外が発生', { error: err });
                    process.exit(1); // 致命的エラーとして処理を終了
                }
            }
        })
            .on('data', (row) => {
            rowIndex++;
            let isRowValid = true;
            const mappedRow = {};
            const recipientId = row[headerKeys[5]]?.trim() ?? ''; // 3列目（index=2）から取得
            requiredIndices.forEach((index) => {
                const columnName = headerKeys[index];
                const rawCellValue = row[columnName]?.trim() ?? '';
                const rawValue = stripBOM(rawCellValue); // ← 値にもBOMの可能性
                const validator = indexValidationMap[index];
                const sizeValidator = indexSizeValidationMap[index];
                const code = headerMap[index]; // headerMap: { 0: 'a', 1: 'b', ... }
                mappedRow[code] = rawValue;
                const emptyCheck = fixedValidator(rawValue);
                const validationCheck = validator(rawValue);
                //  const sizeCheck = sizeValidator(rawValue);
                //   console.log(`🧩 index=${index}, code=${code}, rawValue="${rawValue}"`);
                //   console.log('🗺️ mappedRow:', mappedRow); 
                console.log(index);
                console.log(rowIndex);
                console.log(code);
                console.log(headerKeys[index]);
                console.log(rawValue);
                let i = 0;
                if (!emptyCheck) {
                    logger.error({
                        message: errorMessages[0],
                        行番号: rowIndex,
                        PK: recipientId,
                        項目名: columnName, // ← 項目名（列名）
                        データ値: rawValue,
                        context: 'CSVデータ検証',
                    });
                    console.error(`バリデーション失敗: 行=${rowIndex}, 列=${index + 1}, 値="${rawValue}"`);
                    isRowValid = false;
                }
                else {
                    i++;
                    if (index != 12) {
                        if (!validationCheck) {
                            const baseMessage = errorMessages[i];
                            const detailMessage = errorMessages[indexErrorMessageMap[index]];
                            logger.error({
                                message: `${baseMessage}${detailMessage}`,
                                行番号: rowIndex,
                                PK: recipientId,
                                項目名: columnName, // ← 項目名（列名）
                                データ値: rawValue,
                                context: 'CSVデータ検証',
                            });
                            console.error(`バリデーション失敗: 行=${rowIndex}, 列=${index + 1}, 値="${rawValue}"`);
                            isRowValid = false;
                        }
                        if (index != 5) {
                            //console.log(index);
                            const name = rawValue?.split(' ') ?? ['', ''];
                            //console.log(name[1]);
                            //console.log(name[1].length);
                            for (let j = 0; j < 2; j++) {
                                const sizeCheck = sizeValidator(name[j]);
                                //console.log("ループ");
                                //console.log(name[j].length);
                                //console.log(sizeCheck);
                                if (!sizeCheck) {
                                    logger.error({
                                        message: errorMessages[i + 1],
                                        行番号: rowIndex,
                                        PK: recipientId,
                                        項目名: columnName, // ← 項目名（列名）
                                        データ値: name[j],
                                        context: 'CSVデータ検証',
                                    });
                                    console.error(`バリデーション失敗: 行=${rowIndex}, 列=${index + 1}, 値="${rawValue}"`);
                                    isRowValid = false;
                                }
                            }
                        }
                        else {
                            const sizeCheck = sizeValidator(rawValue);
                            if (!sizeCheck) {
                                logger.error({
                                    message: errorMessages[i + 1],
                                    行番号: rowIndex,
                                    PK: recipientId,
                                    項目名: columnName, // ← 項目名（列名）
                                    データ値: rawValue,
                                    context: 'CSVデータ検証',
                                });
                                console.error(`バリデーション失敗: 行=${rowIndex}, 列=${index + 1}, 値="${rawValue}"`);
                                isRowValid = false;
                            }
                        }
                    }
                    else {
                        if (!validationCheck) {
                            let tmp_i = 0;
                            const result = validateBirthDate(rawValue);
                            if ('reason' in result && result.reason === 'invalidDate') {
                                tmp_i = 1;
                            }
                            const baseMessage = errorMessages[i];
                            const detailMessage = errorMessages[indexErrorMessageMap[index] + tmp_i];
                            logger.error({
                                message: `${baseMessage}${detailMessage}`,
                                行番号: rowIndex,
                                PK: recipientId,
                                項目名: columnName,
                                データ値: rawValue,
                                context: 'CSVデータ検証',
                            });
                            console.error(`バリデーション失敗: 行=${rowIndex}, 列=${index + 1}, 値="${rawValue}"`);
                            isRowValid = false;
                        }
                    }
                }
            });
            rowsWithMeta.push({ line: rowIndex, original: row, mapped: mappedRow, isValid: isRowValid });
        })
            .on('end', async () => {
            const allValid = rowsWithMeta.every(r => r.isValid);
            if (!allValid) {
                console.error(Message.EB050011);
                process.exit(1);
            }
            // ✅ 全件バリデーションOK → inputMap に詰めていく
            const inputMap = new Map();
            let isConflict = false;
            for (const { line, mapped } of rowsWithMeta) {
                const recipientId = mapped['id'];
                const baseCname = mapped['cname'];
                const baseCnameKana = mapped['cname_kana'];
                const baseBirthdate = mapped['birthdate'];
                console.log(`📌 recipientId raw value: ${recipientId}`);
                const [g_lastName, g_firstName] = mapped['uname']?.split(' ') ?? ['', ''];
                const [g_lastNameKana, g_firstNameKana] = mapped['uname_kana']?.split(' ') ?? ['', ''];
                const guardian = {
                    userId: '',
                    lastName: g_lastName,
                    firstName: g_firstName,
                    lastNameKana: g_lastNameKana,
                    firstNameKana: g_firstNameKana,
                    officeId: 'default-office-id',
                    phoneNo: '',
                    email: '',
                    lineUserId: '',
                    isEmailArrivalRequired: false,
                    isEmailLeaveRequired: false,
                    isLineArrivalRequired: false,
                    isLineLeaveRequired: false,
                    isDeleted: false,
                };
                if (!inputMap.has(recipientId)) {
                    inputMap.set(recipientId, {
                        baseRow: mapped,
                        baseLine: line,
                        guardians: [guardian],
                    });
                    console.log(`🟢 新規 recipientId=${recipientId} に guardian を追加`);
                }
                else {
                    const existingBaseRow = inputMap.get(recipientId).baseRow;
                    const existingBaseLine = inputMap.get(recipientId).baseLine;
                    const conflict = existingBaseRow['cname'] !== baseCname ||
                        existingBaseRow['cname_kana'] !== baseCnameKana ||
                        existingBaseRow['birthdate'] !== baseBirthdate;
                    if (conflict) {
                        isConflict = true;
                        logger.error({
                            messageID: "EB050007",
                            message: Message.EB050007,
                            PK: recipientId,
                            "行番号": line,
                            "児童情報（障害児名）": baseCname,
                            "児童情報（障害児カナ）": baseCnameKana,
                            "児童情報（障害児生年月日）": baseBirthdate,
                            "元の行番号": existingBaseLine,
                            "元の児童情報（障害児名）": existingBaseRow['cname'],
                            "元の児童情報（障害児カナ）": existingBaseRow['cname_kana'],
                            "元の児童情報（障害児生年月日）": existingBaseRow['birthdate'],
                            context: '重複データ検出',
                        });
                    }
                    else {
                        inputMap.get(recipientId).guardians.push(guardian);
                        console.log(`🔁 既存 recipientId=${recipientId} に guardian を追加`);
                    }
                }
            }
            if (isConflict) {
                console.error(Message.EB050007);
                process.exit(1);
            }
            else {
                try {
                    const rawItems = [];
                    inputMap.forEach((value, key) => {
                        const recipientId = key;
                        const { baseRow, baseLine, guardians } = value;
                        const updatedGuardians = guardians.map((g, i) => ({
                            ...g,
                            //userId: `${recipientId}-${String.fromCharCode(97 + i)}`, // a, b, c...
                            //userId: `${recipientId}-${i + 1}`, 
                            userId: `${recipientId}-${String(i + 1).padStart(2, '0')}`
                        }));
                        const [lastName, firstName] = baseRow['cname']?.split(' ') ?? ['', ''];
                        const [lastNameKana, firstNameKana] = baseRow['cname_kana']?.split(' ') ?? ['', ''];
                        rawItems.push({
                            recipientId,
                            lastName,
                            firstName,
                            lastNameKana,
                            firstNameKana,
                            dob: baseRow.birthdate,
                            qrCodeName: 'test-qrcode',
                            guardians: updatedGuardians,
                            officeId: 'default-office-id',
                            isDeleted: 'false',
                            createdBy: 'system',
                            updatedBy: 'system',
                            version: 1,
                        });
                    });
                    const items = await addTimestampsToItems(docClient, tblname, rawItems);
                    const batches = chunkArray(items, 25); // DynamoDB の制限に合わせて25件ずつ
                    const limit = pLimit(5); // 同時に5リクエストまで
                    const promises = batches.map(batch => limit(async () => {
                        const putRequests = batch.map(item => ({
                            PutRequest: { Item: item }
                        }));
                        const command = new BatchWriteCommand({
                            RequestItems: {
                                [tblname]: putRequests
                            }
                        });
                        const resp = await docClient.send(command);
                        if (resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length > 0) {
                            console.warn('⚠️ 未処理アイテムあり: リトライを試みます');
                            console.log("✅ UnprocessedItems = ", resp.UnprocessedItems);
                            await retryUnprocessedItems(resp.UnprocessedItems);
                        }
                    }));
                    await Promise.all(promises);
                    console.log(Message.EB050012);
                    resolve();
                }
                catch (err) {
                    console.error('❌ 処理中にエラーが発生しました:', err);
                    reject(err);
                }
            }
        })
            .on('error', reject);
    });
}
const start = Date.now();
const startDate = new Date(start); 

logger.info('📌 バッチ処理開始', {
    startTime: new Date(startDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
});
processCSV(fname)
    .then(() => {
    const end = Date.now();
    const endDate = new Date(end); 

    const durationSec = ((end - start) / 1000).toFixed(2);
    
    logger.info('✅ バッチ処理完了', {
        endTime: new Date(endDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        durationSeconds: durationSec,
        processedItemCount: inputMap.size, // 登録対象件数（recipientIdの数）
    });
    console.log(`🕒 Execution time: ${(end - start) / 1000} seconds`);
})
    .catch((err) => {
    logger.error('❌ バッチ処理中にエラー発生', { error: err });
    console.error('❌ Error occurred:', err);
});
const test = async () => {
    const fakeUnprocessedItems = {
        [tblname]: [
            {
                PutRequest: {
                    Item: {
                        recipientId: { S: '1000000001' },
                        lastName: { S: '広島' },
                        firstName: { S: '隆' },
                        lastNameKana: { S: 'ヒロシマ' },
                        firstNameKana: { S: 'タカシ' },
                        dob: { S: '2015/12/1' },
                        qrCodeName: { S: 'test-qrcode' },
                        guardians: {
                            L: [
                                {
                                    M: {
                                        userId: { S: '1000000001-a' },
                                        lastName: { S: '広島' },
                                        firstName: { S: '隆一' },
                                        lastNameKana: { S: 'ヒロシマ' },
                                        firstNameKana: { S: 'リュウイチ' },
                                        officeId: { S: 'default-office-id' },
                                        phoneNo: { S: '' },
                                        email: { S: '' },
                                        lineUserId: { S: '' },
                                        isEmailArrivalRequired: { BOOL: false },
                                        isEmailLeaveRequired: { BOOL: false },
                                        isLineArrivalRequired: { BOOL: false },
                                        isLineLeaveRequired: { BOOL: false },
                                    },
                                },
                            ],
                        },
                        officeId: { S: 'default-office-id' },
                        createdBy: { S: 'system' },
                        updatedBy: { S: 'system' },
                        version: { N: '11' },
                    },
                },
            },
        ],
    };
    await retryUnprocessedItems(fakeUnprocessedItems, 2, 100);
};
//test();
