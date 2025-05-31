"use client";

import { useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { useTheme, View, Image, Heading, Text, Button } from "@aws-amplify/ui-react";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { Subscription } from 'rxjs';
import { ThemeProvider, createTheme, defaultTheme } from '@aws-amplify/ui-react';
import { I18n } from '@aws-amplify/core';
import { signIn } from 'aws-amplify/auth';


I18n.setLanguage('ja'); 
I18n.putVocabularies({
  ja: {
    'Sign in': '送信',
    'Signing in': '送信中',
    'Incorrect username or password.': 'IDまたはパスワードが間違っています。',
  },
});

const customTheme = createTheme({
  name: 'custom-theme',
  tokens: {
    colors: {
      background: {
        primary: { value: '#f0f0f0' },
      },
    },

    components: {
      button: {
        primary: {
          backgroundColor: { value: 'blue' },  // 背景色（例：青）
          color: { value: 'white' },           // テキスト色（例：白）
          _hover: {
            backgroundColor: { value: '#003399' }, // ホバー時の色（任意）
          },
        },
      },
    },
  },
});

Amplify.configure(outputs);
const client = generateClient<Schema>();

const components = {

  SignIn: {
    Header() {
      const { tokens } = useTheme();

      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          ログイン画面
        </Heading>
      );
    },

     Footer() {
      const { submitForm } = useAuthenticator();

      return (
        <View textAlign="center" padding="1rem">
         
        </View>
      );
    },


    SubmitButton() {
      const { submitForm } = useAuthenticator();
      return (
        <View textAlign="center" padding="1rem">
          <Button
            variation="primary"
            onClick={submitForm}
           /* style={{ backgroundColor: 'blue', color: 'white' }}*/
          >
            送信
          </Button>
        </View>
      );
    },

    }    
  };

  

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


function LoginApp() {
  const [logins, setLogins] = useState<Array<Schema["Login"]["type"]>>([]);
  const [showHistory, setShowHistory] = useState(false);
//  const subscriptionRef = useRef<ReturnType<typeof client.models.Todo.observeQuery> | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const { user, authStatus, signOut } = useAuthenticator(context => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  const isWritingRef = useRef(false);

  // 🔸 書き込み処理（セッション＋useRef）
  useEffect(() => {
    if (authStatus === "authenticated" && user && !isWritingRef.current) {
      const loginId = user.signInDetails?.loginId;
      console.log("loginId:", JSON.stringify(loginId)); 
      if (!loginId) {
        console.log("loginId is none") 
        return;
      }  

      const sessionKey = `hasLogged_${loginId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      isWritingRef.current = true;

      const loginTime = new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });

      client.models.Login.create({
        uid: loginId,
        loginTime:  loginTime
      }).then(() => {
        sessionStorage.setItem(sessionKey, "true");
        console.log("書き込み成功");
        console.log(loginId);
        console.log(loginTime);
      }).catch(err => {
        console.error("書き込み失敗:", err);
      });
    }
  }, [authStatus, user]);

  // 🔸 「履歴を見る」ボタン押下時に購読開始
  const handleShowHistory = () => {
    setShowHistory(true);
    if (subscriptionRef.current) return; // 二重登録防止

    const subscription = client.models.Login.observeQuery().subscribe({
      next: (data) => {
        const sorted = [...data.items]
          .filter((item) => item.loginTime)
          .sort((a, b) =>
            new Date(b.loginTime!).getTime() - new Date(a.loginTime!).getTime()
          )
          .slice(0, 5);
        setLogins(sorted);
      },
    });

    subscriptionRef.current = subscription;
  };

  // 🔸 アンマウント時に購読解除
  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    sessionStorage.clear();
    signOut();
    window.location.reload();
  };

 

  return (
    <main style={{ padding: "1.5rem" }}>
      
      router.push('./list');

      {/*
      <p>こんにちは、{user?.username} さん！</p>

      {!showHistory && (
        <button onClick={handleShowHistory}>履歴を見る</button>
      )}

      {showHistory && (
        <ul>
          {logins.map((login) => (
             <li key={login.id} style={{ display: "flex", gap: "1rem", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
              <div style={{ flex: 1, fontWeight: "bold" }}>{login.uid}</div>
              <div style={{ flex: 2 }}>{login.loginTime}</div>
             </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleSignOut}>サインアウト</button>
      </div>
      */}
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <Authenticator formFields={formFields} components={components} hideSignUp={true} loginMechanisms={["username"]} >
        <LoginApp />
      </Authenticator>
    </ThemeProvider>
  );
}
