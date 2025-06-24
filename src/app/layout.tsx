// src/app/layout.tsx
import type React from "react"

import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from './providers'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider } from "@/context/sidebar-context"
import { Header } from "@/components/layout/header"
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';


Amplify.configure(outputs);



const inter = Inter({ subsets: ["latin"] })


export const metadata = {
  title: "利用実績・予定管理",
  description: "モダンなデザインの利用実績・予定管理アプリケーション",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <SidebarProvider>
              <Header />
              {/* サイドバーとメインコンテンツ */}
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex flex-1 flex-col">
                  
                  <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
                    {children}
                  </main>
                </div>
              </div>

              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}