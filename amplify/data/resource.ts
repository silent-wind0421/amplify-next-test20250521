//amplify/data/resource.ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({



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

  Recipient: a.model({
    recipientId: a.string().required(),
    officeId: a.string(),
    isDeleted: a.boolean(),
    createdAt: a.datetime(),
    createdBy: a.string(),
    updatedAt: a.datetime(),
    updatedBy: a.string(),
    version: a.integer(),
  })
    .identifier(['recipientId'])
    .authorization((allow) => [allow.publicApiKey()]),


  /**
     * @typedef {object} RecipientChild
     * @description 受給者と児童の関係モデル
     * @property {string} recipientId
     * @property {string} childId
     */

  RecipientChild: a.model({
    recipientId: a.string(),
    childId: a.string(),
  })
    .authorization((allow) => [allow.publicApiKey()]),

  /**
   * @typedef {object} User
   * @description システム利用者（保護者等）の基本情報
   */

  User: a.model({
    userId: a.string().required(),
    lastName: a.string().required(),
    firstName: a.string().required(),
    lastNameKana: a.string(),
    firstNameKana: a.string(),
    officeId: a.string(),
    phoneNo: a.string(),
    email: a.string(),
    lineUserId: a.string(),
    isEmailArrivalRequired: a.boolean(),
  })
    .identifier(['userId'])
    .authorization((allow) => [allow.publicApiKey()]),

  /**
   * @typedef {object} Child
   * @description 通所する児童の基本情報
   */

  Child: a.model({
    childId: a.string().required(), // 主キー
    lastName: a.string().required(),
    firstName: a.string().required(),
    lastNameKana: a.string(),
    firstNameKana: a.string(),
    dob: a.date(), // 生年月日
    qrCodeName: a.string(), // QRコード出力用の識別名（画像ファイル名など）
    isDeleted: a.boolean(),
    createdAt: a.datetime(),
    createdBy: a.string(),
    updatedAt: a.datetime(),
    updatedBy: a.string(),
    version: a.integer(),
  })
    .identifier(["childId"])
    .authorization((allow) => [allow.publicApiKey()]),

  /**
  * @typedef {object} ChildUser
  * @description 児童とユーザーの関係を定義する中間テーブル
  */

  ChildUser: a.model({
    childId: a.string().required(),
    userId: a.string().required(),
    createdAt: a.datetime(),
    createdBy: a.string(),
    updatedAt: a.datetime(),
    updatedBy: a.string(),
  })
    .identifier(['childId', 'userId']) // 複合主キーとして扱う場合
    .authorization((allow) => [allow.publicApiKey()]),


  /**
  * @typedef {object} AuthInfo
  * @description 認証情報を保持するモデル
  */

  AuthInfo: a.model({
    staffId: a.string().required(), // 主キー
    loginId: a.string().required(),
    passwordHash: a.string().required(),
    accountStatus: a.string().required(), // enum化も検討可
    failedLoginAttempts: a.integer(),
    lastLoginAt: a.datetime(),
    passwordUpdatedAt: a.datetime(),
    createdAt: a.datetime(),
    createdBy: a.string(),
    updatedAt: a.datetime(),
    updatedBy: a.string(),
  })
    .identifier(['staffId'])
    .authorization((allow) => [allow.publicApiKey()]),


  /**
   * @typedef {object} VisitRecord
   * @description 通所実績データ。来所・退所情報などを保持。
   */

  VisitRecord: a.model({
    visitDate: a.date(), // 旧: a.string()
    officeId: a.string(),
    childId: a.string(),
    plannedArrivalTime: a.time(), // 旧: a.string()
    contractedDuration: a.integer(),

    actualArrivalTime: a.time(), // 旧: a.string()
    actualLeaveTime: a.time(),   // 旧: a.string()
    actualDuration: a.integer(),

    lateReasonCode: a.string(),
    earlyLeaveReasonCode: a.string(),

    isManuallyEntered: a.boolean(),
    isDeleted: a.boolean(),

    createdAt: a.datetime(),
    createdBy: a.string(),
    updatedAt: a.datetime(),
    updatedBy: a.string(),

    version: a.integer(),
    remarks: a.string(),
  }).authorization((allow) => [allow.publicApiKey()]),

  /**
  * @typedef {object} CodeMaster
  * @description 各種コード（理由コードなど）のマスターデータ
  */

  CodeMaster: a.model({
    codeType: a.string().required(),
    codeValue: a.string().required(),
    codeTypeName: a.string(),
    codeTypePhysical: a.string(),
    displayText: a.string().required(),
    shortText: a.string(),
    extra: a.string(), // JSON形式などで保持
    description: a.string(),
  })
    .identifier(['codeType', 'codeValue']) // 複合キーで識別
    .authorization((allow) => [allow.publicApiKey()]),
});


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
