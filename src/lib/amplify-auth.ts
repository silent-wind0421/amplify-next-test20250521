//src/lib/amplify-auth.ts
/**
 * 現在のユーザーがサインインしているかどうかを判定します。
 *
 * `aws-amplify/auth` の `getCurrentUser()` を使用して、
 * 現在のセッションが有効かを確認します。
 * 例外が発生した場合は未サインインと見なします。
 *
 * @async
 * @function
 * @returns {Promise<boolean>} 認証済みであれば `true`、そうでなければ `false` を返します。
 *
 * @example
 * const signedIn = await isSignedIn();
 * if (signedIn) {
 *   console.log("ログイン中");
 * } else {
 *   console.log("未ログイン");
 * }
 */
export async function isSignedIn(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
