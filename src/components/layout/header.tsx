// src/components/layout/header.tsx
"use client"

import { useSidebar } from "@/context/sidebar-context"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
    const { toggle } = useSidebar()

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={toggle} className="mr-2">
                    <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold text-gray-800">プロジェクト名</h1>
            </div>
            <div className="text-sm text-gray-600">ログイン中：真 屋太郎</div>
        </header>
    )
}
