// src/components/layout/header.tsx
"use client"

import { useState } from "react"
import { LogOut, Menu } from "lucide-react"
import { useSidebar } from "@/context/sidebar-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { toast } from "sonner"

export function Header() {
    const { toggle } = useSidebar()
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)


    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={toggle} className="mr-2">
                    <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold text-gray-800">プロジェクト名</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center">
                    <span className="mr-4 text-sm font-medium text-gray-700">真　屋太郎</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLogoutDialogOpen(true)}
                        aria-label="ログアウト"
                        className="rounded-full hover:bg-gray-100"
                    >
                        <LogOut className="h-5 w-5 text-gray-700" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
