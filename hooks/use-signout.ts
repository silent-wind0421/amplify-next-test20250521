import { useAuthenticator } from '@aws-amplify/ui-react';

export function useSignOutHandler() {
  const { signOut } = useAuthenticator();

  return async function handleSignOut() {
    await signOut(); // ここで unauthenticated 状態へ変化
    sessionStorage.clear();
    // 🔸 router.replace('/') は不要 → 状態が unauthenticated になった後に useEffect で処理
  };
}
