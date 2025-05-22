"use client";

import { Amplify } from "aws-amplify";
import { Authenticator, SignIn, useAuthenticator } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { useTheme, View, Image, Heading, Text, Button } from "@aws-amplify/ui-react";
import './app.css' 
import { ThemeProvider, defaultTheme } from '@aws-amplify/ui-react';
import { I18n } from '@aws-amplify/core';


I18n.setLanguage('ja'); 
I18n.putVocabularies({
  ja: {
    'Sign in': '送信',
    'Signing in': '送信中',
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



Amplify.configure(outputs);

const components = {

  SignIn: {
    /*
    FormFields() {
      const { getFieldProps } = useAuthenticator();

      return (
        <View>
          <TextField {...getFieldProps("username")} label="ユーザー名" />
          <TextField {...getFieldProps("password")} label="パスワード" type="password" />
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
     placeholder: '半角英数８文字以内で入力してください',
     isRequired: true,
    }, 

    password: {
      label: 'Password:',
      placeholder: '半角英数８文字以内で入力してください',
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

export default function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <Authenticator formFields={formFields} components={components} hideSignUp={true} loginMechanisms={["username", "e-mail"]} >
        {({ signOut }) => <button onClick={signOut}>Sign out</button>}
      </Authenticator>
    </ThemeProvider>  
  );
}

