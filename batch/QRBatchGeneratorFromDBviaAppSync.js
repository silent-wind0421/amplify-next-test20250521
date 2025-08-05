var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import QRCode from 'qrcode';
import { GraphQLClient, gql } from 'graphql-request';
import { ErrorMessages_QR } from './errorMessages.js';
import { createAppLogger } from './nlogger.js';
var logger = createAppLogger('qr');
// __dirname 再現
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// 出力ディレクトリ
var outputDir = path.join(__dirname, 'output');
try {
    if (fs.existsSync(outputDir)) {
        var stat = fs.statSync(outputDir);
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
    setTimeout(function () { return process.exit(1); }, 100);
    //process.exit(1);
}
// GraphQL設定
var GRAPHQL_API_ENDPOINT = 'https://7brky2hzojh5zirbqdssnvr7zm.appsync-api.ap-northeast-1.amazonaws.com/graphql';
//const GRAPHQL_API_ENDPOINT = 'https://z7bhpd2gdrcbrefgfklqzljgrm.appsync-api.ap-northeast-1.amazonaws.com/graphql';
var GRAPHQL_API_KEY = 'da2-4iwvhetckzdkdcgblti63hs6gi';
//const GRAPHQL_API_KEY = 'da2-bkzdse4rvjf2dhja5ld6zluqqe';
var client = new GraphQLClient(GRAPHQL_API_ENDPOINT, {
    headers: {
        'x-api-key': GRAPHQL_API_KEY,
    },
});
// GraphQLクエリ
var query = gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  query ListUserRecipientProfiles {\n    listUserRecipientProfiles {\n      items {\n        recipientId\n        isDeleted\n      }\n    }\n  }\n"], ["\n  query ListUserRecipientProfiles {\n    listUserRecipientProfiles {\n      items {\n        recipientId\n        isDeleted\n      }\n    }\n  }\n"])));
// UID取得関数
// Promise:非同期処理の「未来の結果」を表すオブジェクト(API呼び出し, ファイル読み込み, 待ち時間などに対応)
function fetchUIDsFromGraphQL() {
    return __awaiter(this, void 0, void 0, function () {
        var data, items, ids, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 8]);
                    return [4 /*yield*/, client.request(query)];
                case 1:
                    data = _b.sent();
                    items = (_a = data === null || data === void 0 ? void 0 : data.listUserRecipientProfiles) === null || _a === void 0 ? void 0 : _a.items;
                    if (!(!items || !Array.isArray(items))) return [3 /*break*/, 3];
                    logger.error({
                        message: ErrorMessages_QR.invalidResponse()
                    });
                    console.error("❌ APIレスポンスに必要なデータが存在しません");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 2:
                    _b.sent();
                    process.exit(1);
                    _b.label = 3;
                case 3:
                    ids = items
                        .filter(function (item) { return item.isDeleted === false; })
                        .map(function (item) { return item.recipientId; })
                        .filter(function (id) { return Boolean(id); });
                    if (!(ids.length === 0)) return [3 /*break*/, 5];
                    logger.error({
                        message: ErrorMessages_QR.emptyId()
                    });
                    console.error("❌ 受給者IDが空データです。");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 4:
                    _b.sent();
                    process.exit(1);
                    _b.label = 5;
                case 5:
                    console.log("\u2705 GraphQL\u304B\u3089".concat(ids.length, "\u4EF6\u306EUID\u3092\u53D6\u5F97\u3057\u307E\u3057\u305F"));
                    return [2 /*return*/, ids];
                case 6:
                    error_1 = _b.sent();
                    logger.error({
                        message: ErrorMessages_QR.invalidGraphQL_API()
                    });
                    console.error('❌ GraphQLの取得に失敗しました:', error_1);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 7:
                    _b.sent();
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// QRコード生成関数
function generateQRCodes(ids) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, ids_1, id, outputPath, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, ids_1 = ids;
                    _a.label = 1;
                case 1:
                    if (!(_i < ids_1.length)) return [3 /*break*/, 6];
                    id = ids_1[_i];
                    outputPath = path.join(outputDir, "".concat(id, ".png"));
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, QRCode.toFile(outputPath, id, {
                            width: 256,
                            margin: 2,
                        })];
                case 3:
                    _a.sent();
                    console.log("\u2705 ".concat(id, " \u2192 ").concat(outputPath));
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    logger.error({
                        message: ErrorMessages_QR.failedQRCodeGeneration(),
                        "受給者ID": id
                    });
                    console.error("\u274C ".concat(id, " \u306EQR\u30B3\u30FC\u30C9\u751F\u6210\u306B\u5931\u6557:"), err_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// 実行
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var ids;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchUIDsFromGraphQL()];
            case 1:
                ids = _a.sent();
                return [4 /*yield*/, generateQRCodes(ids)];
            case 2:
                _a.sent();
                console.log('🎉 QRコード生成完了');
                return [2 /*return*/];
        }
    });
}); })();
var templateObject_1;
