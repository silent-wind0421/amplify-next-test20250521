"use client";

import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { useTheme, View, Image, Heading, Text, Button } from "@aws-amplify/ui-react";
import './app.css' 
import { ThemeProvider, defaultTheme } from '@aws-amplify/ui-react';
import { I18n } from '@aws-amplify/core';
import { FetchUserAttributesOutput, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from "react";
import { signIn } from 'aws-amplify/auth';




I18n.setLanguage('ja'); 
I18n.putVocabularies({
  ja: {
    'Sign in': '送信',
    'Signing in': '送信中',
    'Incorrect username or password.': 'IDまたはパスワードが間違っています。',
  },
});

const customTheme = {
  ...defaultTheme,
  tokens: {
    ...defaultTheme.tokens,
    colors: {
      ...defaultTheme.tokens.colors,
      background: {
        primary: { value: '#F4F4F4;' } 
      }
    }
  }
};



Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-northeast-1_z60CJDdU7",
      userPoolClientId: "6gnv9qldhuos82bvc7gkcudp7m",
      identityPoolId: "ap-northeast-1:8390aebf-9353-4adf-9ada-0b096192993f",
      loginWith: {
        username: true,
      },
}}});



//Amplify.configure(outputs); 

const components = {

  SignIn: {
    /*
    FormFields() {
      const { getFieldProps } = useAuthenticator();

      return (
        <View>
          <TextField {...getFieldProps("username")} autoComplete="off" />
          <TextField {...getFieldProps("password")} autoComplete="off" type="password" />
        </View>
      );
    },*/

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
            label="送信"
            style={{ backgroundColor: 'blue', color: 'white' }}
          >
          </Button>
        </View>
      );
    },

    
  },

  SignUp: {
    Header() {
      const { tokens } = useTheme();

      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Create a new account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();

      return (
        <View textAlign="center">
          <Button
            fontWeight="normal"
            onClick={toSignIn}
            size="small"
            variation="link"
          >
            Back to Sign In
          </Button>
        </View>
      );
    },
  },
  ConfirmSignUp: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Enter Information:
        </Heading>
      );
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
  SetupTotp: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Enter Information:
        </Heading>
      );
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
  ConfirmSignIn: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Enter Information:
        </Heading>
      );
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
  ForgotPassword: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Enter Information:
        </Heading>
      );
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
  ConfirmResetPassword: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Enter Information:
        </Heading>
      );
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
  SelectMfaType: {
    Header() {
      return <Heading level={3}>Select Desired MFA Type</Heading>;
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
  SetupEmail: {
    Header() {
      return <Heading level={3}>Email MFA Setup</Heading>;
    },
    Footer() {
      return <Text>Footer Information</Text>;
    },
  },
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
  signUp: {
    password: {
      label: 'Password:',
      isRequired: true,
      order: 2,
    },
    confirm_password: {
      label: 'Confirm Password:',
      order: 1,
    },
  },
  forceNewPassword: {
    password: {
      placeholder: 'Enter your Password:',
    },
  },
  forgotPassword: {
    username: {
      placeholder: 'Enter your email:',
    },
  },
  confirmResetPassword: {
    confirmation_code: {
      placeholder: 'Enter your Confirmation Code:',
      label: 'New Label',
      isRequired: false,
    },
    confirm_password: {
      placeholder: 'Enter your Password Please:',
    },
  },
  setupTotp: {
    QR: {
      totpIssuer: 'test issuer',
      totpUsername: 'amplify_qr_test_user',
    },
    confirmation_code: {
      label: 'New Label',
      placeholder: 'Enter your Confirmation Code:',
      isRequired: false,
    },
  },
  confirmSignIn: {
    confirmation_code: {
      label: 'New Label',
      placeholder: 'Enter your Confirmation Code:',
      isRequired: false,
    },
  },
  setupEmail: {
    email: {
      label: 'New Label',
      placeholder: 'Please enter your Email:',
    },
  },
};

/*
const handleSignIn = async () => {
  try {
    const userId = "test_cognito";
    const password = "3#6FnZH8J\G";

    const userData = await signIn(userId, password);

    // 全体を確認
    console.log("✅ ユーザーデータ:", userData);

    // 特定の情報を確認
    console.log("ユーザー名:", userData.username);
    console.log("属性:", userData.attributes);
    console.log("メールアドレス:", userData.attributes?.email);
  } catch (error) {
    console.error("❌ サインイン失敗:", error);
  }
};

*/
export default function App() {

   const [attr, setAttrResult] = useState<FetchUserAttributesOutput>();
   const getCurrentUserAsync = async () => {
    const result = await fetchUserAttributes();
    console.log(result);
    setAttrResult(result);
  };

  useEffect(() => {
    getCurrentUserAsync();
  }, []);


  /*useEffect(() => {
    handleSignIn();
  }, []);*/
  
  return (
    <ThemeProvider theme={customTheme}>
      <Authenticator formFields={formFields} components={components} hideSignUp={true} loginMechanisms={["username"]} >
        {({ signOut, user }) => (
        <main style={{ padding: "1.5rem" }}>
          <h1>ようこそ、{user?.username} さん</h1>
          <p>{JSON.stringify(attr)}</p>
          <h1>元気ですか？ {attr?.preferred_username} さん</h1>
          
          <button onClick={signOut}>ログアウト</button>

        </main>
      )}
      </Authenticator>
    </ThemeProvider>  
  );
}

