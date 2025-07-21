"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useLoginTracker } from "@/hooks/use-logintracker";
import { useSignOutHandler } from '@/hooks/use-signout';  

export default function LoginApp() {
  //認証情報の取得  
  const { user, authStatus, signOut } = useAuthenticator(context => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  const handleSignOut = useSignOutHandler();

  useLoginTracker(user, authStatus, "/list");

  

  return (
    <main style={{ padding: "1.5rem" }}>
      <p>現在、更新中・・・</p>
      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleSignOut}>サインアウト</button>
      </div>
    </main>
  );
}
