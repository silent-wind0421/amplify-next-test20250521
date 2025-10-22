// qr-dynamo.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import QRCode from 'qrcode';

// ▼ 追加：AWS SDK v3
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { ErrorMessages_QR } from './errorMessages.js';
import { createAppLogger } from './nlogger.js';
const logger = createAppLogger('qr');

// __dirname 再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 出力ディレクトリ
const outputDir = path.join(__dirname, 'output');
try {
  if (fs.existsSync(outputDir)) {
    const stat = fs.statSync(outputDir);
    if (!stat.isDirectory()) {
      // throw new Error('指定パスがファイルです（ディレクトリではありません）');
      throw new Error();
    }
  } else {
    fs.mkdirSync(outputDir);
  }
} catch (error) {
  logger.error({ message: ErrorMessages_QR.noDirectoryPermission() });
  console.error('❌ 出力先ディレクトリの作成に失敗しました:', error);
  setTimeout(() => process.exit(1), 100);
}

// ========= AWS SDK (DynamoDB) 設定 =========
// 環境変数などで上書き可
const reg = 'ap-northeast-1';
const tblname = 'Recipient-xogfmayxofaavkuqqeh33ygzka-NONE'; 

const ddb = new DynamoDBClient({ region: reg });
// marshall/unmarshallをラップしたDocクライアント
const docClient = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
});

// ========= データ取得（GraphQL → DynamoDBに置換） =========
/**
 * DynamoDBのRecipientsテーブルから全件（ページング）取得して
 * { recipientId, lastName, firstName } に整形して返す
 */
async function fetchUIDsFromDynamoDB() {
  try {
    const collected = [];
    let ExclusiveStartKey = undefined;

    // ProjectionExpression: 欲しいカラムのみ
    // 予約語衝突回避のために #別名 を使う（念のため）
    const ProjectionExpression = [
      '#recipientId',
      '#lastName',
      '#firstName',
      '#isDeleted',
    ].join(', ');

    const ExpressionAttributeNames = {
      '#recipientId': 'recipientId',
      '#lastName': 'lastName',
      '#firstName': 'firstName',
      '#isDeleted': 'isDeleted',
    };

    do {
      const cmd = new ScanCommand({
        TableName: tblname,
        ProjectionExpression,
        ExpressionAttributeNames,
        ExclusiveStartKey,
        // 1リクエストあたりの上限はDynamoDB側が決めるので Limit は任意
        // Limit: 1000,
      });
      const data = await docClient.send(cmd);

      const items = Array.isArray(data.Items) ? data.Items : [];

      /*
      console.log('Scan Items count:', data.Items?.length ?? 0);
      if ((data.Items?.length ?? 0) > 0) {
        // 先頭1件とキー一覧、型も確認
        const first = data.Items[0];
        console.log('Sample item:', first);
        console.log('Keys:', Object.keys(first));
        console.log('recipientId=', first.recipientId, 'type=', typeof first.recipientId);
        console.log('isDeleted   =', first.isDeleted,   'type=', typeof first.isDeleted);
      }
      */


      collected.push(...items);

      ExclusiveStartKey = data.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    // isDeleted === false & recipientId ありのみ抽出
    const recipients = collected
      .filter((item) => item?.isDeleted === 'false' && item?.recipientId)
      .map((item) => ({
        recipientId: String(item.recipientId),
        lastName: item.lastName ?? '',
        firstName: item.firstName ?? '',
      }));

    if (recipients.length === 0) {
      logger.error({ message: ErrorMessages_QR.emptyId() });
      console.error('❌ 受給者IDが空データです。');
      await new Promise((r) => setTimeout(r, 100));
      process.exit(1);
    }

    console.log(`✅ DynamoDBから${recipients.length}件のUIDを取得しました`);
    return recipients;
  } catch (error) {
    logger.error({ message: ErrorMessages_QR.invalidGraphQL_API?.() ?? 'DynamoDB取得エラー' });
    console.error('❌ DynamoDBからの取得に失敗しました:', error);
    await new Promise((r) => setTimeout(r, 100));
    process.exit(1);
  }
}

// ========= QRコード生成 =========
async function generateQRCodes(recipients) {

  let failure = 0;

  for (const r of recipients) {
    const last = r.lastName ?? '';
    const first = r.firstName ?? '';
    const fileName = `${r.recipientId}_${last}${first}.png`;
    const outputPath = path.join(outputDir, fileName);

    try {
      await QRCode.toFile(outputPath, r.recipientId, {
        width: 256,
        margin: 2,
      });
      console.log(`✅ ${r.recipientId} → ${outputPath}`);
    } catch (err) {
      logger.error({
        message: ErrorMessages_QR.failedQRCodeGeneration(),
        '受給者ID': r.recipientId,
      });
      console.error(`❌ ${r.recipientId} のQRコード生成に失敗:`, err);
      failure++;
    }
  }
  return { total: recipients.length, failure };
}

// ========= 実行 =========
(async () => {
  const start = Date.now();
  const startDate = new Date(start);
  logger.info('📌 バッチ処理開始', {
    startTime: new Date(startDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
  });

  const recipients = await fetchUIDsFromDynamoDB();
  const result = await generateQRCodes(recipients); 
  console.log('🎉 QRコード生成完了');

  const end = Date.now();
  const endDate = new Date(end);

    const durationSec = ((end - start) / 1000).toFixed(2);
    logger.info('✅ バッチ処理完了', {
        endTime: new Date(endDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        durationSeconds: durationSec,
        QRコード生成処理回数:result.total,
        QRコード生成処理失敗回数:result.failure,
    });
})();
