import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'ap-northeast-1_qZe3b8qSj',
  identityPoolId: 'ap-northeast-1:61ed2994-d310-471e-b1d1-cd9ee0a488c5',
  authRoleArn: 'arn:aws:iam::845531086046:role/service-role/adminrole',
  unauthRoleArn: 'arn:aws:iam::845531086046:role/service-role/guest',
  userPoolClientId: '1li0b757gut3kav5eounnu6f8t',
    
  groups: {
    admin:"arn:aws:iam::845531086046:role/service-role/adminrole", 
    user:"arn:aws:iam::845531086046:role/service-role/guest",
  },
});