"use client";

// import { Authenticator } from "@aws-amplify/ui-react";  modified by yoshida
// import { signOut } from "aws-amplify/auth"; // これが重要 modified by yoshida
import AttendanceManagement from "@/components/attendance-management";
import { SeedButton } from "@/components/seed-button";

// modified by yoshida
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {

         const { authStatus } = useAuthenticator((context) => [context.authStatus]);
         const router = useRouter();
         const [isReady, setIsReady] = useState(false); // 描画制御用
  
        // 認証済みなら画像URLを設定
        console.log(isReady)

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

          if (authStatus === 'configuring' || !isReady) {
            
            return null;
          }else{
  
            console.log(authStatus);
            return (
   

              <div className="space-y-4">
          

              {process.env.NEXT_PUBLIC_SHOW_SEED_BUTTON === "true" && (
              <div className="flex justify-end">
                  <SeedButton />
              </div>
              )}

              <AttendanceManagement />
              </div>
    
            );
          };
}
