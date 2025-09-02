import { useAuthenticator } from '@aws-amplify/ui-react';

export function useSignOutHandler() {
  const { signOut } = useAuthenticator();

  return async function handleSignOut() {
    sessionStorage.clear();
   // await signOut({ global: true }); // ここで unauthenticated 状態へ変化
    await signOut();
    //sessionStorage.clear();
    
  };
}
