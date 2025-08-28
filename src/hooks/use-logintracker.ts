import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>({ authMode: "userPool" });


// 🔸 書き込み処理（セッション＋useRef）
/*
  useRefだけだと、画面の再リロードによって値が失われるので、制御として不十分。
  また、sessionStorageだけだと、sessionStorageの書き込み反映には時間がかかり、
  その間に書き込みが複数回起こる可能性があるので、useRefでの制御が必要
*/

export function useLoginTracker(user: any, authStatus: string, redirectPath: string) {
  const isWritingRef = useRef(false); //useRefの初期値の設定
  const router = useRouter();

  useEffect(() => {
    const writeLoginDataOnce = async () => {
      if (authStatus !== "authenticated" || !user || isWritingRef.current) return;


      const loginId = user.signInDetails?.loginId;
      if (!loginId) {
        if (process.env.NODE_ENV === "development") {
          console.warn("loginId is missing");
        }
        return;
      }

      /* sessionStorageにデータがあれば以降の処理はスキップ */
      const sessionKey = `hasLogged_${loginId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      isWritingRef.current = true;

      const now = new Date();
      const loginTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // JST

      try {
        const nowIso = loginTime.toISOString();
        const staffId =
          // Cognito sub が user.userId or user.username に入っているケースが多い
          (user?.userId as string | undefined) ??
          (user?.username as string | undefined) ??
          loginId; // 最後の手段

        // 既存の LoginAccount（同 staffId & loginId）があれば更新、無ければ作成
        const { data: accounts } = await client.models.LoginAccount.list({
          filter: {
            staffId: { eq: staffId },
            loginId: { eq: loginId },
          },
        });

        if (accounts && accounts.length > 0) {
          await client.models.LoginAccount.update({
            id: accounts[0].id,        // update は id 必須
            lastLoginAt: nowIso,
            accountStatus: "active",
            updatedAt: nowIso,
            updatedBy: staffId,
          });
        } else {
          await client.models.LoginAccount.create({
            loginAccountId: crypto.randomUUID(), // 主キー名は loginAccountId
            staffId,
            loginId,
            provider: "cognito",
            accountStatus: "active",
            failedLoginAttempts: 0,
            lastLoginAt: nowIso,
            isDeleted: false,
            createdAt: nowIso,
            createdBy: staffId,
            updatedAt: nowIso,
            updatedBy: staffId,
          });
        }
        sessionStorage.setItem(sessionKey, "true");

        if (process.env.NODE_ENV === "development") {
          console.log("Login recorded:", loginId, loginTime.toISOString());
        }

        // 遷移のタイミングが早いと認証エラーが起こりうる(遷移先の認証に起因)ため、表示を遅らせる
        setTimeout(() => {
          router.replace(redirectPath);  //遷移の履歴を残さない(ブラウザーバックを防ぐ)
        }, 100);
      } catch (err) {
        console.error("Login write failed:", err);
      }
    };

    writeLoginDataOnce();
  }, [authStatus, user]);
}

