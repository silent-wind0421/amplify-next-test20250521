// src/app/layout.tsx
import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"

import { Providers } from './providers'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider } from "@/context/sidebar-context"

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
              {/* 共通ヘッダー */}
              <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {/* サイドバー toggle を使うなら SidebarContext を反映 */}
                  <h1 className="text-xl font-bold">プロジェクト名</h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">真　屋太郎</span>
                </div>
              </header>

              {/* サイドバーとメインコンテンツ */}
              <div className="flex min-h-[calc(100vh-4rem)]">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
                  {children}
                </main>
              </div>

              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}