// nlogger.ts
import { createLogger, transports, format } from 'winston';
import path from 'path';
import fs from 'fs';
var logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
/**
 * 指定した名前でログファイルを分けるロガーを作成
 * @param name 識別用のログ名（例: "qrBatch", "userImport"）
 */
export function createAppLogger(name) {
    var safeName = name.replace(/[^\w\-]/g, ''); // 安全なファイル名に変換（英数字・_・-のみ）
    return createLogger({
        level: 'info',
        format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
        transports: [
            new transports.File({
                filename: path.join(logDir, "".concat(safeName, ".error.log")),
                level: 'error',
            }),
            new transports.File({
                filename: path.join(logDir, "".concat(safeName, ".combined.log")),
            }),
        ],
    });
}
