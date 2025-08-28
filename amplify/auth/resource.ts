import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'ap-northeast-1_qZe3b8qSj',
  identityPoolId: 'ap-northeast-1:9f1270e4-b810-4e0f-be59-2b0ea555cde7',
  authRoleArn: 'arn:aws:iam::845531086046:role/service-role/general',
  unauthRoleArn: 'arn:aws:iam::845531086046:role/service-role/temporary',
  userPoolClientId: '7aikh7ctth2bk9ddr1jmpul05p',
    
  groups: {
    admin:"arn:aws:iam::845531086046:role/service-role/general", 
    user:"arn:aws:iam::845531086046:role/service-role/temporary",
  },
});