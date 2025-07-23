import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();


 // 🔸 書き込み処理（セッション＋useRef）
/*
  useRefだけだと、画面の再リロードによって値が失われるので、制御として不十分。
  また、sessionStorageだけだと、sessionStorageの書き込み反映には時間がかかり、
  その間に書き込みが複数回起こる可能性があるので、useRefでの制御が必要
*/

export function useLoginTracker(user: any, authStatus: string, redirectPath: string = "/list")
 {
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
        await client.models.Login.create({
          uid: loginId,
          loginTime: loginTime.toISOString(),
        });
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

