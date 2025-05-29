//src/app/providers.tsx
'use client';

import { Amplify } from 'aws-amplify';

Amplify.configure({
    aws_project_region: process.env.NEXT_PUBLIC_AWS_REGION,
    aws_appsync_graphqlEndpoint: process.env.NEXT_PUBLIC_APPSYNC_URL,
    aws_appsync_region: process.env.NEXT_PUBLIC_AWS_REGION,
    aws_appsync_authenticationType: 'API_KEY', // ← 環境に応じて変える
    aws_appsync_apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
} as any); // 👈 型チェックを回避
