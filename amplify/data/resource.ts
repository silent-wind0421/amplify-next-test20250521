//amplify/data/resource.ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({

 

  // 受給者
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

RecipientChild: a.model({
  recipientId: a.string(),
  childId: a.string(),
})
.authorization((allow) => [allow.publicApiKey()]),

// 利用者
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

 // 児童
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

// 児童利用者連携
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


// 認証情報
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


// RecipientUser: a.model({
//   recipientId: a.string(),
//   userId: a.string(),
// })
// .authorization((allow) => [allow.publicApiKey()]),


//   RecipientCertificate: a.model({
//     certificateId: a.string().required(),
//     childId: a.string().required(),
//     officeId: a.string().required(),
//     validFrom: a.date(),
//     validTo: a.date(),
//     status: a.string(),
//   })
//   .identifier(['certificateId'])
//   .authorization((allow) => [allow.publicApiKey()]),

   // 通所実績
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

  // コードマスタ
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
