import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({

  userPoolId: "ap-northeast-1_z60CJDdU7",
  userPoolClientId: "6gnv9qldhuos82bvc7gkcudp7m",
  identityPoolId: "ap-northeast-1:8390aebf-9353-4adf-9ada-0b096192993f",
  authRoleArn: 'arn:aws:iam::845531086046:role/service-role/IAMFullAccess',
  /*
  userPoolId: 'us-east-1_xxxx',
  identityPoolId: 'us-east-1:b57b7c3b-9c95-43e4-9266-xxxx',
  authRoleArn: 'arn:aws:iam::xxxx:role/amplify-xxxx-mai-amplifyAuthauthenticatedU-xxxx',
  unauthRoleArn: 'arn:aws:iam::xxxx:role/amplify-xxxx-mai-amplifyAuthunauthenticate-xxxx',
  userPoolClientId: 'xxxx',*/
});