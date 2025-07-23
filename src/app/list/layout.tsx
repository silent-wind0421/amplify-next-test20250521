// src/app/layout.tsx

import type React from "react";
// import { Authenticator } from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
import "./app-list.css";
import { Inter } from "next/font/google";
//import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/context/sidebar-context";
import { Header } from "@/components/layout/header";
//import { Amplify } from "aws-amplify";
//import outputs from "../../../amplify_outputs.json";
import { AppRoot } from "@/components/app-root";

//Amplify.configure(outputs);

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "kotayori",
  description: "モダンなデザインの利用実績・予定管理アプリケーション",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  
      <div className="app-container">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppRoot />
              <Header className="fixed left-0 top-0 w-full z-50" />
              <div className="flex min-h-screen pt-16">
                <Sidebar className="mt-8" />
                <div className="flex flex-1 flex-col">
                
                  <main className="pt-16 bg-gray-50 p-4">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
      </div>
   
     
  );
}
