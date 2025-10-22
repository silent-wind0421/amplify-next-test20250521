import { useAuthenticator } from '@aws-amplify/ui-react';

export function useSignOutHandler() {
  const { signOut } = useAuthenticator();

  return async function handleSignOut() {
    sessionStorage.clear();
   
    await signOut();
    await fetch('/api/session', { method: 'DELETE', credentials: 'include'  })
    
  };
}
