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
import { I18n } from '@aws-amplify/core';
import { signIn } from 'aws-amplify/auth';
import { useRouter } from "next/navigation";

// 日本語表示
I18n.setLanguage('ja'); 
I18n.putVocabularies({
  ja: {
    'Sign in': '送信',
    'Signing in': '送信中',
    'Incorrect username or password.': 'IDまたはパスワードが間違っています。',
  },
});

//amplify settingの反映
Amplify.configure(outputs);

// dynamodbの作成
const client = generateClient<Schema>();


//　Amplify UIのカスタマイズ
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
  const router = useRouter();
  
  //認証情報の取得
  const { user, authStatus, signOut } = useAuthenticator(context => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  const isWritingRef = useRef(false); //useRefの初期値の設定

  // 🔸 書き込み処理（セッション＋useRef）
  useEffect(() => {

    //  認証状態かつ書き込みがまだされてない時
    if (authStatus === "authenticated" && user && !isWritingRef.current) {
      const loginId = user.signInDetails?.loginId;
      console.log("loginId:", JSON.stringify(loginId)); 

      if (!loginId) {
        console.log("loginId is none") 
        return;
      }  

      /* sessionStorageにデータがあれば以降の処理はスキップ */
      const sessionKey = `hasLogged_${loginId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      isWritingRef.current = true; //useRefのcurrentの書き換え（二重書き込み防止）

      /* ISO形式への変換
      const japanDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
      const isoString = new Date(japanDate).toISOString(); // "2025-06-01T05:00:00.000Z"
      */

      const now = new Date(); // 現在のUTC時間
      // JST に変換する（UTC+9時間）
      const jstTimestamp = new Date(now.getTime() + 9 * 60 * 60 * 1000);

      // loginTime に代入
      const loginTime: Date = jstTimestamp;

      /*
      const loginTime = new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });*/

      client.models.Login.create({
        uid: loginId,
        loginTime:  loginTime
      }).then(() => {
        sessionStorage.setItem(sessionKey, "true");
        console.log("書き込み成功");
        console.log(loginId);
        console.log(loginTime.toISOString());

        setTimeout(() => {
          router.replace("/list");
        }, 100);
        //router.push("/list");
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

  const handleSignOut = async () => {
    sessionStorage.clear();
    await signOut();
 //   window.location.reload();
  };

 
  return (
    <main style={{ padding: "1.5rem" }}>
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

      <div style={{ marginTop: "1rem" }}>
      <button onClick={() => router.push('/list')}>一覧ページへ</button>
    </div> 

    </main>
  );
}

export default function App() {
  return (
  
      <Authenticator formFields={formFields} components={components} hideSignUp={true} loginMechanisms={["username"]} >
        <LoginApp />
      </Authenticator>
 
  );
}
