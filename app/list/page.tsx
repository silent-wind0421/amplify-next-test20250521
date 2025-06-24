//import "./app-list.css" ; // added 20250606
'use client'

import AttendanceManagement from "@/components/attendance-management"
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';

export default function Home() {

  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false); // 描画制御用
  
  // 認証済みなら画像URLを設定
  useEffect(() => {
    if (authStatus === 'authenticated') {
      setIsReady(true); // 認証OK → 描画許可
      console.log("✅ 認証されています");
    }
  }, [authStatus, router]);

  // 未認証ならリダイレクト
  useEffect(() => {
    if (authStatus !== 'authenticated' && authStatus !== 'configuring') {
      console.log("🔒 未認証のためトップにリダイレクトします");
      router.replace('/');
    }
  }, [authStatus, router]);

  if (!isReady) return null;

  return <AttendanceManagement />
}
