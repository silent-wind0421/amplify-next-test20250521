"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useLoginTracker } from "@/hooks/use-logintracker";
import { useSignOutHandler } from "@/hooks/use-signout";

export default function LoginApp() {
  //認証情報の取得
  const { user, authStatus, signOut } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  const handleSignOut = useSignOutHandler();

  useLoginTracker(user, authStatus, "/list");

  return (
    <main className="flex items-center justify-center h-screen">
      <div>
        <p className="text-lg mb-4">現在、更新中・・・</p>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          サインアウト
        </button>
      </div>
    </main>
  );
}
