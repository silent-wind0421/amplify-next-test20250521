// logger.ts
import { createLogger, transports, format } from 'winston';
import path from 'path';
import fs from 'fs';
// ログディレクトリが存在しない場合は作成
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const jstTimestamp = format.timestamp({
        format: () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
});
  
const logger = createLogger({
    
    level: 'info', // 最低ログレベル（'error', 'warn', 'info', 'debug' など）

    format: format.combine(jstTimestamp, format.errors({ stack: true }), // エラーに stack trace を含める
    format.json() // ログを JSON 形式で出力
    ),
    transports: [
        // エラーログは error.log に保存
        new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        // 全ログは combined.log に保存
        new transports.File({ filename: path.join(logDir, 'combined.log') })
    ],
});
// 開発時のみコンソール出力（オプション）
/*
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}
*/
export default logger;
