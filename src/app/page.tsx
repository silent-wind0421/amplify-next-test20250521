"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { signOut } from "aws-amplify/auth"; // これが重要
import AttendanceManagement from "@/components/attendance-management";
import { SeedButton } from "@/components/seed-button";

export default function AttendancePage() {
  return (
    <Authenticator
      components={{
        SignIn: {
          Footer() {
            return (
              <div className="text-center mt-4">
                <button
                  onClick={() => signOut()}
                  className="text-sm text-red-600 underline"
                >
                  セッションをリセット（サインアウト）
                </button>
              </div>
            );
          },
        },
      }}
    >
      {({ signOut }) => (
        <div className="space-y-4">
          <button
            className="text-sm text-blue-600 underline"
            onClick={() => {
              signOut?.();
            }}
          >
            サインアウト
          </button>

          {process.env.NEXT_PUBLIC_SHOW_SEED_BUTTON === "true" && (
            <div className="flex justify-end">
              <SeedButton />
            </div>
          )}

          <AttendanceManagement />
        </div>
      )}
    </Authenticator>
  );
}
