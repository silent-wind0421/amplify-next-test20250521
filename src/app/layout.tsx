// src/app/layout.tsx
import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from './providers'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster" 

const inter = Inter({ subsets: ["latin"] })

/**
 * アプリケーションのメタデータ設定
 * 
 * - ページタイトル、説明文、ジェネレーター情報を提供。
 * - Next.js の metadata API で使用可能。
 */

export const metadata = {
  title: "利用実績・予定管理",
  description: "モダンなデザインの利用実績・予定管理アプリケーション",
  generator: 'v0.dev'
}

/**
 * アプリケーションのルートレイアウト
 * 
 * - 全ページに共通のレイアウト構成を提供。
 * - グローバルCSS、フォント、テーマ切替、状態管理プロバイダ、Toaster を含む。
 * 
 * @component
 * @param {Object} props - コンポーネントの props
 * @param {React.ReactNode} props.children - ネストされる子要素（ページコンテンツ）
 * @returns {JSX.Element} HTML構造を返す
 */

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
            {children}
            <Toaster /> 
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
