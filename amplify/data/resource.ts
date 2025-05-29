//amplify/data/resource.ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  VisitRecord: a.model({
    visitDate: a.string(),
    officeId: a.string(),
    childId: a.string(),
    plannedArrivalTime: a.string(),
    contractedDuration: a.integer(),

    actualArrivalTime: a.string(),
    actualLeaveTime: a.string(),
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
  }).authorization((allow) => [allow.publicApiKey()])
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
