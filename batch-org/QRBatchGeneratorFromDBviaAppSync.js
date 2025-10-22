import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import QRCode from 'qrcode';
import { GraphQLClient, gql } from 'graphql-request';
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
            //throw new Error('指定パスがファイルです（ディレクトリではありません）');
            throw new Error;
        }
    }
    else {
        fs.mkdirSync(outputDir);
    }
}
catch (error) {
    logger.error({
        message: ErrorMessages_QR.noDirectoryPermission()
    });
    console.error('❌ 出力先ディレクトリの作成に失敗しました:', error);
    setTimeout(() => process.exit(1), 100);
    //process.exit(1);
}
// GraphQL設定
//const GRAPHQL_API_ENDPOINT = 'https://cetvmhiulvhl7edzohgsphdqki.appsync-api.ap-northeast-1.amazonaws.com/graphql'; // for staging
const GRAPHQL_API_ENDPOINT = 'https://d7bjm63jwjaedgdtl7lss4dlvi.appsync-api.ap-northeast-1.amazonaws.com/graphql'; //for feature/logout
const GRAPHQL_API_KEY = 'da2-kzycmdsrurhydhwh3cxt7cbcp4'; //for feature/logout
//const GRAPHQL_API_KEY = 'da2-4iwvhetckzdkdcgblti63hs6gi';
//const GRAPHQL_API_KEY = 'da2-3ykehhe72jhs5ntrajy7fs53fi'; //for staging
const client = new GraphQLClient(GRAPHQL_API_ENDPOINT, {
    headers: {
        'x-api-key': GRAPHQL_API_KEY,
    },
});
// GraphQLクエリ
const query = gql `
  query ListRecipients($limit: Int, $nextToken: String) {
    listRecipients(limit: $limit, nextToken: $nextToken) {
      items { recipientId lastName firstName isDeleted }
      nextToken
    }
  }
`;
// UID取得関数
// Promise:非同期処理の「未来の結果」を表すオブジェクト(API呼び出し, ファイル読み込み, 待ち時間などに対応)
async function fetchUIDsFromGraphQL() {
    try {
        const data_a = [];
        let nextToken = null;
        do {
            const vars = { limit: 1000 };
            if (nextToken)
                vars.nextToken = nextToken;
            const data = await client.request(query, vars);
            
            const items = data.listRecipients?.items;
            // let iitems = null;
            // 配列でなければエラー扱いにして終了
            // if (!Array.isArray(iitems)) {
            if (!Array.isArray(items)) {
                logger.error({ message: ErrorMessages_QR.invalidResponse() });
                console.error('❌ APIレスポンスに必要なデータが存在しません');
                await new Promise((resolve) => setTimeout(resolve, 100));
                process.exit(1);
            }
            data_a.push(...items);
            nextToken = data.listRecipients?.nextToken ?? null;
        } while (nextToken);

        // 受給者IDが存在して、isDeleted が false のものだけ抽出
        const recipients = data_a
            .filter((item) => item?.isDeleted === false && item?.recipientId)
            .map((item) => ({
                recipientId: String(item.recipientId),
                lastName: item.lastName ?? '',
                firstName: item.firstName ?? '',
            }));

        // 受給者IDが空の場合
        if (recipients.length === 0) {
            logger.error({
                message: ErrorMessages_QR.emptyId()
            });
            console.error("❌ 受給者IDが空データです。");
            await new Promise((resolve) => setTimeout(resolve, 100));
            process.exit(1);
        }
        console.log(`✅ GraphQLから${recipients.length}件のUIDを取得しました`);
        return recipients;
    }
    catch (error) {
        logger.error({
            message: ErrorMessages_QR.invalidGraphQL_API()
        });
        console.error('❌ GraphQLの取得に失敗しました:', error);
        await new Promise((resolve) => setTimeout(resolve, 100));
        process.exit(1);
    }
}
// QRコード生成関数
async function generateQRCodes(recipients) {
   // let i = 0;
    for (const r of recipients) {
        //  for (let id of ids) {
        

      //  if(i % 2 === 0)r.lastName = null;
       // i++;
      
        const last = (r.lastName ?? '');
        const first = (r.firstName ?? '');
       
      //  if(last ==='')console.log(i);

        const fileName = `${r.recipientId}_${last}${first}.png`;
        const outputPath = path.join(outputDir, fileName);
        
        try {
            await QRCode.toFile(outputPath, r.recipientId, {
                width: 256,
                margin: 2,
            });
            console.log(`✅ ${r.recipientId} → ${outputPath}`);
        }
        catch (err) {
            logger.error({
                message: ErrorMessages_QR.failedQRCodeGeneration(),
                "受給者ID": r.recipientId
            });
            console.error(`❌ ${r.recipientId} のQRコード生成に失敗:`, err);
        }
    }
}
// 実行
(async () => {
    const recipients = await fetchUIDsFromGraphQL();
    await generateQRCodes(recipients);
    console.log('🎉 QRコード生成完了');
})();
