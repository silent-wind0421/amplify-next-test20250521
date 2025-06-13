// app/template.tsx
"use client";

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { ThemeProvider } from '@aws-amplify/ui-react';
import { createTheme } from '@aws-amplify/ui-react'; 
import { useEffect } from 'react';
import "./app.css";

//　ログインフォームの設定
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


export default function RootTemplate({ children }: { children: React.ReactNode }) {

  console.log("template");

  // 背景色をマウント時に設定　
   useEffect(() => {
    document.body.style.backgroundColor = "#ADD8E6";

    // クリーンアップ（必要に応じて元に戻す）
   /* return () => {
      document.body.style.backgroundColor = "";
    };*/
  }, []);

  return (
    <ThemeProvider theme={customTheme}>  
      <Authenticator.Provider>      
          {children}
      </Authenticator.Provider>  
    </ThemeProvider>
  );
}
