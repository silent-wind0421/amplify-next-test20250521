// src/app/qr-reception-screen/layout.tsx
// import { Sidebar } from "@/components/sidebar" // または ui/sidebar.tsx
import type { ReactNode } from "react"

export default function QrReceptionLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen">
            {/* <Sidebar /> */}
            <main className="flex-1">{children}</main>
        </div>
    )
}
