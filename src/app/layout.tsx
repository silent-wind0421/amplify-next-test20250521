// src/app/layout.tsx
import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from './providers'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster" 

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
            {children}
            <Toaster /> 
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
