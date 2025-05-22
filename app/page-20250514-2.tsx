"use client";

import { Amplify } from "aws-amplify";
import {
  Authenticator,
  useAuthenticator,
  View,
  TextField,
  Button,
  Heading,
} from "@aws-amplify/ui-react";
import { I18n } from "@aws-amplify/core";
import { useState, useRef } from "react";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

// Amplify 設定
Amplify.configure(outputs);

// i18n 日本語化 & エラーメッセージカスタマイズ
I18n.setLanguage("ja");
I18n.putVocabularies({
  ja: {
    "Sign in": "送信",
    "Signing in": "送信中",
    "Incorrect username or password.": "ユーザー名またはパスワードが間違っています。",
  },
});

// サインインUI（カスタム）
const CustomSignIn = () => {
  const { signIn } = useAuthenticator();
  const [errorMessage, setErrorMessage] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = usernameRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    try {
      await signIn({ username, password });
      setErrorMessage("");
    } catch (error: any) {
      console.error("Sign in error:", error);
      setErrorMessage(error.message || "サインインに失敗しました");
      if (passwordRef.current) {
        passwordRef.current.value = "";
      }
    }
  };

  return (
    <View as="form" onSubmit={handleSignIn} padding="1.5rem">
      <Heading level={3}>ログイン</Heading>

      {errorMessage && (
        <View color="red" marginTop="1rem" marginBottom="1rem">
          {errorMessage}
        </View>
      )}

      <TextField
        id="emailSignIn"
        label="ユーザー名"
        type="text"
        autoComplete="off"
        ref={usernameRef}
        placeholder="ユーザー名を入力"
        required
      />

      <TextField
        id="passwordSignIn"
        label="パスワード"
        type="password"
        autoComplete="new-password"
        ref={passwordRef}
        placeholder="パスワードを入力"
        required
        marginTop="1rem"
      />

      <Button type="submit" variation="primary" fullWidth marginTop="1.5rem">
        送信
      </Button>
    </View>
  );
};

// ✅ カスタム signIn 関数だけを提供
const services = {
  async handleSignIn({ username, password }) {
    // ここは Amplify Auth を直接使ってもOK
    const { Auth } = await import("aws-amplify");
    return await Auth.signIn(username, password);
  },
};

// アプリ本体
export default function App() {
  return (
    <Authenticator
      components={{ SignIn: CustomSignIn }}
      services={services}
      hideSignUp={true}
    >
      {({ signOut, user }) => (
        <main style={{ padding: "1.5rem" }}>
          <h1>ようこそ、{user?.username} さん</h1>
          <Button onClick={signOut}>ログアウト</Button>
        </main>
      )}
    </Authenticator>
  );
}
