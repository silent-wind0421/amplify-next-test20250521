// src/app/providers.tsx
'use client';

import { useEffect } from 'react';
import { configureAmplify } from '../../amplify/configureAmplify';

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        configureAmplify();
    }, []);

    return <>{children}</>;
}
