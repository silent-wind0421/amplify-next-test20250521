'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator, SignIn, useAuthenticator, Button, View } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json';
import './app.css';

Amplify.configure(outputs);

export default function App() {
  return (
    <Authenticator>
      <SignIn slot="primary-footer-content">
        <CustomSignInButton />
      </SignIn>

      {({ signOut, user }) => (
        <main style={{ padding: '1rem' }}>
          <h1>こんにちは、{user?.username} さん</h1>
          <button onClick={signOut}>ログアウト</button>
        </main>
      )}
    </Authenticator>
  );
}

function CustomSignInButton() {
  const { submitForm } = useAuthenticator();

  return (
    <View textAlign="center" padding="1rem">
      <Button
        variation="primary"
        onClick={submitForm}
        style={{
          backgroundColor: 'blue',
          color: 'white',
          width: '100%',
        }}
      >
        送信
      </Button>
    </View>
  );
}
