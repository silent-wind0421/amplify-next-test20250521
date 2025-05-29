//src/app/providers.tsx
'use client';

import { Amplify } from 'aws-amplify';

import amplifyConfig from '../amplify_outputs.json';
Amplify.configure(amplifyConfig);
