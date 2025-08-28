import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

// ------------------------------------------------------------
// NOTE: 現在の Amplify パッケージ版に合わせて互換性修正
// - a.array / a.customType を使わず、1:N は hasMany/belongsTo のモデルで表現
// - enum 定義はフィールドに直接 a.enum([..]) を指定（.required() は付けない）
//   ※ 一部の版では a.enum(..).required() が型エラーになるため
// ------------------------------------------------------------

const schema = a.schema({
  // ---------------- Facility（事業所） ----------------
  Facility: a.model({
    officeId: a.id().required(),
    name: a.string().required(),
    nameKana: a.string(),
    phoneNo: a.string(),
    email: a.string(),
    lineServiceAccountId: a.string(),
    alexaUnitId: a.string(),
    isDeleted: a.boolean().required(),
    createdAt: a.string().required(),
    createdBy: a.string().required(),
    updatedAt: a.string(),
    updatedBy: a.string(),
    version: a.integer(),
    // VisitRecord の逆参照（VisitRecord.facility の対応）
    visitRecords: a.hasMany("VisitRecord", "officeId"),
  }).authorization((allow) => [allow.owner()]),

  // ---------------- Recipient（受給者情報） --------------
  Recipient: a.model({
    recipientId: a.id().required(), // 受給者承認番号
    lastName: a.string().required(),
    firstName: a.string().required(),
    lastNameKana: a.string(), // 全角カナ
    firstNameKana: a.string(), // 全角カナ
    dob: a.string(), // YYYYMMDD
    qrCodeName: a.string(), // QRコード出力用（画像ファイル名）
    officeId: a.string(), // 所属事業所ID
    isDeleted: a.boolean().required(),
    createdAt: a.string().required(),
    createdBy: a.string().required(),
    updatedAt: a.string(),
    updatedBy: a.string(),
    version: a.integer(),
    // リレーション
    visitRecords: a.hasMany("VisitRecord", "recipientId"),
    guardians: a.hasMany("Guardian", "recipientId"),
  }).identifier(['recipientId'])
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]), // ← APIキー利用者は read のみ許可
      allow.authenticated().to(['read']),
      allow.groups(['admin']).to(['create', 'update', 'delete', 'read']),
    ]),
  // ---------------- Guardian（保護者：1:N モデル化） ---------
  Guardian: a.model({
    guardianId: a.id().required(),
    recipientId: a.id().required(),

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
    isEmailLeaveRequired: a.boolean(),
    isLineArrivalRequired: a.boolean(),
    isLineLeaveRequired: a.boolean(),
    isDeleted: a.boolean().required(),

    // 任意の監査項目（必要なら）
    createdAt: a.string(),
    createdBy: a.string(),
    updatedAt: a.string(),
    updatedBy: a.string(),

    // リレーション
    recipient: a.belongsTo("Recipient", "recipientId"),
  }).authorization((allow) => [allow.owner()]),

  // ---------------- VisitRecord（通所実績） ----------------
  VisitRecord: a.model({
    visitRecordId: a.id().required(),
    visitDate: a.string().required(), // YYYY-MM-DD（実績対象日）
    officeId: a.id().required(),
    recipientId: a.string().required(), // ← childId からリネーム
    plannedArrivalTime: a.string(), // HH:mm
    contractedDuration: a.integer(), // 分
    actualArrivalTime: a.string(), // HH:mm（QR/手入力）
    actualLeaveTime: a.string(), // HH:mm（QR/手入力）
    actualDuration: a.integer(), // 分
    status: a.string(), // コード値はフロント側の型で担保（"0"|"1"|"2"|"3"）
    reason: a.string(), // 同上（"0"|"1"|"2"|"3"|"99"）
    note: a.string(),
    isManuallyEntered: a.boolean().required(), // true:手入力,false:QR
    isDeleted: a.boolean().required(),
    createdAt: a.string().required(), // ISO8601
    createdBy: a.string().required(), // UUID など
    updatedAt: a.string().required(), // ISO8601
    updatedBy: a.string().required(), // UUID など
    version: a.integer(),

    // リレーション
    facility: a.belongsTo("Facility", "officeId"),
    recipient: a.belongsTo("Recipient", "recipientId"),
  }).authorization((allow) => [
    allow.publicApiKey().to(["read"]), // ← APIキー利用者は read のみ許可
    allow.groups(['admin']).to(['create', 'update', 'delete', 'read']),
  ]),

  // ---------------- Staff（職員プロフィール：権限表示用） ------------
  Staff: a.model({
    staffId: a.id().required(), // Cognito sub を推奨
    displayName: a.string().required(),
    email: a.string(),
    phoneNo: a.string(),
    title: a.string(),
    // officeIds の配列はバージョン互換のため省略（必要なら別モデルで関連づけ）

    isDeleted: a.boolean().required(),
    createdAt: a.string().required(),
    createdBy: a.string().required(),
    updatedAt: a.string(),
    updatedBy: a.string(),
    version: a.integer(),

    // リレーション
    roleGrants: a.hasMany("RoleGrant", "staffId"),
    loginAccount: a.hasOne("LoginAccount", "staffId"),
  }).authorization((allow) => [allow.owner()]),

  // ---------------- RoleGrant（権限付与：情報保持用） -------------
  RoleGrant: a.model({
    roleGrantId: a.id().required(),
    staffId: a.string().required(), // Staff.staffId
    role: a.enum(["systemAdmin", "officeAdmin", "editor", "viewer"]),
    scopeType: a.enum(["system", "office"]), // system / office
    scopeId: a.string(), // scopeType=office のときに officeId を入れる
    memo: a.string(), // 任意（付与理由など）

    isDeleted: a.boolean().required(),
    createdAt: a.string().required(),
    createdBy: a.string().required(),
    updatedAt: a.string(),
    updatedBy: a.string(),
    version: a.integer(),

    // リレーション
    staff: a.belongsTo("Staff", "staffId"),
  }).authorization((allow) => [allow.owner()]),

  // ---------------- LoginAccount（認証はCognito、ここはメタ情報のみ） ----
  LoginAccount: a.model({
    loginAccountId: a.id().required(),
    staffId: a.string().required(),      // Staff.staffId（= Cognito sub 推奨）
    loginId: a.string().required(),      // 例: Cognito username / federated subject
    provider: a.enum(["cognito", "google", "line"]),
    accountStatus: a.enum(["active", "suspended"]),
    failedLoginAttempts: a.integer(),     // ※必要ならCognitoイベントで同期（任意）
    lastLoginAt: a.string(),              // ISO8601
    isDeleted: a.boolean().required(),
    createdAt: a.string().required(),
    createdBy: a.string().required(),
    updatedAt: a.string(),
    updatedBy: a.string(),
    version: a.integer(),

    staff: a.belongsTo("Staff", "staffId"),
  }).authorization((allow) => [
    // 本人だけでなく、管理者ロール（例: Cognitoグループ）にも読ませる
    allow.groups(["systemAdmin", "officeAdmin"]),
    allow.owner(),
  ]),

});
export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});