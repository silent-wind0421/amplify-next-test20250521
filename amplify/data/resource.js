"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
//amplify/data/resource.ts
var backend_1 = require("@aws-amplify/backend");
var schema = backend_1.a.schema({
    /**
     * @typedef {object} Recipient
     * @description 受給者情報を表すモデル
     * @property {string} recipientId - 一意の受給者ID（主キー）
     * @property {string} [officeId] - 所属事業所ID
     * @property {boolean} [isDeleted] - 削除フラグ
     * @property {Date} [createdAt] - 作成日時
     * @property {string} [createdBy] - 作成者
     * @property {Date} [updatedAt] - 更新日時
     * @property {string} [updatedBy] - 更新者
     * @property {number} [version] - バージョン管理用
     */
    Recipient: backend_1.a
        .model({
        recipientId: backend_1.a.string().required(),
        officeId: backend_1.a.string(),
        isDeleted: backend_1.a.boolean(),
        createdAt: backend_1.a.datetime(),
        createdBy: backend_1.a.string(),
        updatedAt: backend_1.a.datetime(),
        updatedBy: backend_1.a.string(),
        version: backend_1.a.integer(),
    })
        .identifier(["recipientId"])
        .authorization(function (allow) { return [allow.publicApiKey()]; }),
    /**
     * @typedef {object} RecipientChild
     * @description 受給者と児童の関係モデル
     * @property {string} recipientId
     * @property {string} childId
     */
    RecipientChild: backend_1.a
        .model({
        recipientId: backend_1.a.string(),
        childId: backend_1.a.string(),
    })
        .authorization(function (allow) { return [allow.publicApiKey()]; }),
    /**
     * @typedef {object} User
     * @description システム利用者（保護者等）の基本情報
     */
    User: backend_1.a
        .model({
        userId: backend_1.a.string().required(),
        lastName: backend_1.a.string().required(),
        firstName: backend_1.a.string().required(),
        lastNameKana: backend_1.a.string(),
        firstNameKana: backend_1.a.string(),
        officeId: backend_1.a.string(),
        phoneNo: backend_1.a.string(),
        email: backend_1.a.string(),
        lineUserId: backend_1.a.string(),
        isEmailArrivalRequired: backend_1.a.boolean(),
    })
        .identifier(["userId"])
        .authorization(function (allow) { return [allow.publicApiKey()]; }),
    /**
     * @typedef {object} VisitRecord
     * @description 通所実績データ。来所・退所情報などを保持。
     */
    VisitRecord: backend_1.a
        .model({
        id: backend_1.a.id().required(),
        visitDate: backend_1.a.date(), // 旧: a.string()
        officeId: backend_1.a.string(),
        childId: backend_1.a.string(),
        child: backend_1.a.belongsTo("Child", "childId"),
        plannedArrivalTime: backend_1.a.time(), // 旧: a.string()
        contractedDuration: backend_1.a.integer(),
        actualArrivalTime: backend_1.a.time(), // 旧: a.string()
        actualLeaveTime: backend_1.a.time(), // 旧: a.string()
        actualDuration: backend_1.a.integer(),
        lateReasonCode: backend_1.a.string(),
        earlyLeaveReasonCode: backend_1.a.string(),
        isManuallyEntered: backend_1.a.boolean(),
        isDeleted: backend_1.a.boolean(),
        createdAt: backend_1.a.datetime(),
        createdBy: backend_1.a.string(),
        updatedAt: backend_1.a.datetime(),
        updatedBy: backend_1.a.string(),
        version: backend_1.a.integer(),
        remarks: backend_1.a.string(),
    })
        .identifier(["id"])
        // .authorization((allow) => [allow.publicApiKey()])
        .authorization(function (allow) { return [
        allow.publicApiKey().to(["read"]), // ← APIキー利用者は read のみ許可
        allow.authenticated().to(["read", "create", "update"]), // ← Cognito認証ユーザー
    ]; }),
    /**
     * @typedef {object} Child
     * @description 通所する児童の基本情報
     */
    Child: backend_1.a
        .model({
        childId: backend_1.a.string().required(), // 主キー
        lastName: backend_1.a.string().required(),
        firstName: backend_1.a.string().required(),
        lastNameKana: backend_1.a.string(),
        firstNameKana: backend_1.a.string(),
        dob: backend_1.a.date(), // 生年月日
        qrCodeName: backend_1.a.string(), // QRコード出力用の識別名（画像ファイル名など）
        isDeleted: backend_1.a.boolean(),
        createdAt: backend_1.a.datetime(),
        createdBy: backend_1.a.string(),
        updatedAt: backend_1.a.datetime(),
        updatedBy: backend_1.a.string(),
        version: backend_1.a.integer(),
        visitRecords: backend_1.a.hasMany("VisitRecord", "childId"),
    })
        .identifier(["childId"])
        // .authorization((allow) => [allow.publicApiKey()])
        .authorization(function (allow) { return [
        allow.publicApiKey().to(["read"]),
        allow.authenticated().to(["read", "create", "update"]),
    ]; }),
    /**
     * @typedef {object} ChildUser
     * @description 児童とユーザーの関係を定義する中間テーブル
     */
    ChildUser: backend_1.a
        .model({
        childId: backend_1.a.string().required(),
        userId: backend_1.a.string().required(),
        createdAt: backend_1.a.datetime(),
        createdBy: backend_1.a.string(),
        updatedAt: backend_1.a.datetime(),
        updatedBy: backend_1.a.string(),
    })
        .identifier(["childId", "userId"]) // 複合主キーとして扱う場合
        .authorization(function (allow) { return [allow.publicApiKey()]; }),
    /**
     * @typedef {object} AuthInfo
     * @description 認証情報を保持するモデル
     */
    AuthInfo: backend_1.a
        .model({
        staffId: backend_1.a.string().required(), // 主キー
        loginId: backend_1.a.string().required(),
        passwordHash: backend_1.a.string().required(),
        accountStatus: backend_1.a.string().required(), // enum化も検討可
        failedLoginAttempts: backend_1.a.integer(),
        lastLoginAt: backend_1.a.datetime(),
        passwordUpdatedAt: backend_1.a.datetime(),
        createdAt: backend_1.a.datetime(),
        createdBy: backend_1.a.string(),
        updatedAt: backend_1.a.datetime(),
        updatedBy: backend_1.a.string(),
    })
        .identifier(["staffId"])
        .authorization(function (allow) { return [allow.publicApiKey()]; }),
    /**
     * @typedef {object} CodeMaster
     * @description 各種コード（理由コードなど）のマスターデータ
     */
    CodeMaster: backend_1.a
        .model({
        codeType: backend_1.a.string().required(),
        codeValue: backend_1.a.string().required(),
        codeTypeName: backend_1.a.string(),
        codeTypePhysical: backend_1.a.string(),
        displayText: backend_1.a.string().required(),
        shortText: backend_1.a.string(),
        extra: backend_1.a.string(), // JSON形式などで保持
        description: backend_1.a.string(),
    })
        .identifier(["codeType", "codeValue"]) // 複合キーで識別
        .authorization(function (allow) { return [allow.publicApiKey()]; }),
});
exports.data = (0, backend_1.defineData)({
    schema: schema,
    authorizationModes: {
        defaultAuthorizationMode: "userPool",
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
