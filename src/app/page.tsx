"use client";

import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useTheme, View, Heading, Button, useAuthenticator } from "@aws-amplify/ui-react";
import { I18n } from '@aws-amplify/core';

import LoginApp from "./loginapp"; 

// 日本語表示設定
I18n.setLanguage('ja'); 
I18n.putVocabularies({
  ja: {
    'Sign in': '送信',
    'Signing in': '送信中',
    'Incorrect username or password.': 'IDまたはパスワードが間違っています。',
  },
});

// Amplify設定を反映
Amplify.configure(outputs);

// Amplify UIのカスタマイズ
const components = {
  SignIn: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`} level={3}>
          ログイン画面
        </Heading>
      );
    },
    Footer() {
      return <View textAlign="center" padding="1rem" />;
    },
    SubmitButton() {
      const { submitForm } = useAuthenticator();
      return (
        <View textAlign="center" padding="1rem">
          <Button variation="primary" onClick={submitForm}>
            送信
          </Button>
        </View>
      );
    },
  }
};

// サインイン画面のフィールド設定
const formFields = {
  signIn: {
    username: {
      label: 'ID:',
      placeholder: '半角英数記号８文字以上で入力してください',
      isRequired: true,
    },
    password: {
      label: 'Password:',
      placeholder: '半角英数記号８文字以上で入力してください',
      isRequired: true,
    },
  },
};

export default function App() {
  return (
    <Authenticator
      formFields={formFields}
      components={components}
      hideSignUp={true}
      loginMechanisms={["username"]}
    >
      <LoginApp />
    </Authenticator>
  );
}