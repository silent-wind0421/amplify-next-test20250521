import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'ap-northeast-1_IVHfj8jlH',
  identityPoolId: 'ap-northeast-1:d7fa0f56-b34b-40d6-9182-373b0c72918c',
  authRoleArn: 'arn:aws:iam::845531086046:role/service-role/adminrole',
  unauthRoleArn: 'arn:aws:iam::845531086046:role/service-role/guest',
  userPoolClientId: '31l0k63r1ifgc20j56m0i3korm',
    
  groups: {
    admin:"arn:aws:iam::845531086046:role/service-role/adminrole", 
    user:"arn:aws:iam::845531086046:role/service-role/guest",
  },
});