"use client";

import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useTheme, View, Heading, Button, useAuthenticator, Alert } from "@aws-amplify/ui-react";
import { I18n } from '@aws-amplify/core';
import { signIn } from 'aws-amplify/auth';   
import { useEffect } from "react";
import QrReceptionScreen from "@/components/qr-reception-screen";
import { SidebarProvider } from "@/context/sidebar-context";
import LoginApp from "../loginapp"; 

// 日本語表示設定
I18n.setLanguage('ja'); 
I18n.putVocabularies({
  ja: {
    'Sign in': '送信',
    'Signing in': '送信中',
    'Incorrect username or password.': 'IDまたはパスワードが間違っています。',
    'PreAuthentication failed with error Incorrect username or password.': 'IDまたはパスワードが間違っています。'
  },
});

// Amplify設定を反映
//Amplify.configure(outputs);

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

  useEffect(() => {
    document.body.style.backgroundColor = "#ADD8E6";

    // クリーンアップ（必要に応じて元に戻す）
    /* return () => {
      document.body.style.backgroundColor = "";
    };*/
  }, []);
  
  
  const loginType: 'user' | 'admin' = 'admin';

  console.log('loginType', loginType);

  return (
    <Authenticator
      formFields={formFields}
      components={components}
      hideSignUp={true}
      loginMechanisms={["username"]}
      services={{
        async handleSignIn(formData: any) {
          const { username, password } = formData;
          try {
              return await signIn({
                username,
                password,
                options: {
                    authFlowType: 'USER_PASSWORD_AUTH',
                    clientMetadata: { loginType }, // ← PreAuth へ渡す
                },
              });
          } catch (err) {
            // 文字列化
              const raw =
              typeof err === 'string'
              ? err
              : (err as any)?.message ?? String(err ?? '');

          // PreAuth 由来や一般的な認証失敗は日本語に差し替え
              const isAuthFail =
              /PreAuthentication failed/i.test(raw) ||
              /Incorrect username or password/i.test(raw) ||
              /UserNotFoundException|NotAuthorizedException/i.test(raw);

            if (isAuthFail) {
              // ← ここで日本語メッセージを投げ直す
                throw new Error(I18n.get('Incorrect username or password.'));
            }
              // それ以外はそのまま（デフォルト帯に英語等で表示）
            throw err;
        }
      },
    }}
  
  /*  services={{
        async handleSignIn(formData) {
          const { username, password } = formData;
          console.log('handleSignIn called', formData?.username);
          return signIn({
            username,
            password,
            options: { authFlowType: 'USER_PASSWORD_AUTH', clientMetadata: { loginType } },
          });
        },
      }}*/
      
    >
     <LoginApp destination="/list" loginType="admin"/>  
     {/*<div className="fixed inset-0">
      <SidebarProvider>
        <QrReceptionScreen />
      </SidebarProvider> 
     </div> */}
    </Authenticator>
  );
}