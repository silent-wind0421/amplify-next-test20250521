import type React from "react"
import "./app-list.css"  // modified 20250606
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

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

// modified 20250606  
  return (
   /*
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
     */
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className={inter.className}>
            {children}
          </div>
        </ThemeProvider>

     /*   
       </body>
    </html> 
     */ 
  )
}
