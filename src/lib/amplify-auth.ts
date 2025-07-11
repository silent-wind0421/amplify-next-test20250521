// src/lib/amplify-auth.ts
import { signIn, signOut, getCurrentUser } from "aws-amplify/auth";

/**
 * 現在の認証状態を確認します。
 *
 * `aws-amplify/auth` の `getCurrentUser()` を使用し、
 * 現在のセッションが有効かどうかを確認します。
 * セッションが無効、またはユーザーが未ログインの場合は `false` を返します。
 *
 * @returns {Promise<boolean>} 認証済みなら `true`、未認証なら `false`。
 *
 * */
export async function safeSignIn(username: string, password: string) {
  try {
    const user = await getCurrentUser();
    console.log("すでにサインイン済み:", user);
    return user;
  } catch {
    try {
      return await signIn({ username, password });
    } catch (err) {
      console.error("サインインエラー:", err);
      throw err;
    }
  }
}

/**
 * 明示的に現在のユーザーをサインアウトする。
 */
export async function safeSignOut() {
  try {
    await signOut();
    console.log("サインアウトしました");
  } catch (err) {
    console.error("サインアウト失敗:", err);
  }
}

/**
 * 現在の認証状態を確認する。
 *
 * @returns {Promise<boolean>} サインイン済みなら true、未サインインなら false。
 */
export async function isSignedIn(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
