// src/app/layout.tsx

"use client";

import type React from "react";

import "@aws-amplify/ui-react/styles.css";
import "./app-list.css";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/context/sidebar-context";
import { Header } from "@/components/layout/header";

import { AppRoot } from "@/components/app-root";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "kotayori",
//   description: "モダンなデザインの利用実績・予定管理アプリケーション",
//   generator: "v0.dev",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isQrScreen = pathname.includes("/qr-reception-screen");

  return (
    <div className="app-container">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          {!isQrScreen && <AppRoot />}
          {!isQrScreen && <Header className="fixed left-0 top-0 w-full z-50" />}
          <div className={`flex min-h-screen ${isQrScreen ? "" : "pt-8"}`}>
            {!isQrScreen && <Sidebar className="mt-8" />}
            <div className="flex flex-1 flex-col">
              <main className={`${isQrScreen ? "" : "pt-8 bg-gray-50 p-4"}`}>
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
