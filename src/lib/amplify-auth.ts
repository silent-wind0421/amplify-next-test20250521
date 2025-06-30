// src/lib/amplify-auth.ts
import { Auth } from "aws-amplify";

/**
 * 現在のユーザーがサインイン済みか確認する。
 * @returns Promise<boolean> 認証済みかどうか
 */
export async function isSignedIn(): Promise<boolean> {
  try {
    await Auth.currentAuthenticatedUser();
    return true;
  } catch {
    return false;
  }
}
