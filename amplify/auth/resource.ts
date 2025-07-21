import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'ap-northeast-1_z60CJDdU7',
  identityPoolId: 'ap-northeast-1:8390aebf-9353-4adf-9ada-0b096192993f',
  authRoleArn: 'arn:aws:iam::845531086046:role/service-role/IAMFullAccess',
  unauthRoleArn: 'arn:aws:iam::845531086046:role/service-role/unauthorizedrole',
  userPoolClientId: '6gnv9qldhuos82bvc7gkcudp7m',
});
