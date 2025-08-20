// src/app/_auth-utils.ts
"use client";
import { useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

export function useForceSignOutOnMount() {
  const { signOut } = useAuthenticator((c) => [c.signOut]);
  useEffect(() => {
    if (sessionStorage.getItem("forceSignOut") === "1") {
      sessionStorage.removeItem("forceSignOut");
      void signOut(); // ここでセッション破棄 → Authenticatorがフォームを表示
    }
  }, [signOut]);
}
