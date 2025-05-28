// src/app/providers.tsx
'use client';

import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json';


Amplify.configure(amplifyConfig);

export function Providers({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
