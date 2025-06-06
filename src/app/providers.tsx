// src/app/providers.tsx
'use client';

import { useEffect } from 'react';
import { configureAmplify } from '../../amplify/configureAmplify';

/**
 * アプリ全体に適用されるプロバイダラッパーコンポーネント。
 *
 * - Amplify のクライアント設定（configureAmplify）を初期化時に一度だけ実行
 * - 子要素（App全体）をそのままラップして返す
 *
 * @param {Object} props - コンポーネントのprops
 * @param {React.ReactNode} props.children - ラップ対象のReact要素
 * @returns {JSX.Element} 子要素を含むJSX
 */

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        configureAmplify();
    }, []);

    return <>{children}</>;
}
