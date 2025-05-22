"use client";

import React from "react";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

// Amplify 設定
Amplify.configure(outputs);

// カスタムログインフォーム
const CustomSignInForm = () => {
  const { submitForm, toForgotPassword } = useAuthenticator();

  return (
    <div style={{ width: '300px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>ログイン</h2>
      <form onSubmit={submitForm}>
        <div style={{ marginBottom: '1rem' }}>
          <label>ユーザー名</label>
          <input name="username" type="text" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>パスワード</label>
          <input name="password" type="password" required style={{ width: '100%' }} />
        </div>
        <button type="submit" style={{ width: '100%' }}>ログイン</button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={toForgotPassword} style={{ border: 'none', background: 'none', color: '#0077cc' }}>
          パスワードを忘れた時はこちら
        </button>
      </div>
    </div>
  );
};

// アプリ全体のラッパー
const AppWithHeader = () => {
  return (
    <div className="auth-wrapper">
      <Authenticator components={{ SignIn: CustomSignInForm }}>
        {({ signOut, user }) => (
          <main>
            <h1>こんにちは、{user?.username} さん</h1>
            <button onClick={signOut}>ログアウト</button>
          </main>
        )}
      </Authenticator>
    </div>
  );
};

export default AppWithHeader;
