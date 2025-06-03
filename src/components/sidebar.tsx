//src/component/sidebar.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Users,
  Settings,
  X,
  UserCog,
  Calendar,
  ClipboardList,
  FileOutput,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Shield,
  LayoutGrid,
  BabyIcon as Child,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  active?: boolean
  children?: MenuItem[]
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const menuItems: MenuItem[] = [
    {
      icon: UserCog,
      label: "事務所スタッフ管理",
      href: "#",
      children: [
        { icon: Users, label: "スタッフ管理", href: "#" },
        { icon: Briefcase, label: "シフト", href: "#" },
        { icon: Shield, label: "権限管理", href: "#" },
      ],
    },
    { icon: Users, label: "利用者管理", href: "#" },
    { icon: Child, label: "児童管理", href: "#" },
    { icon: Settings, label: "利用枠管理", href: "#" },
    {
      icon: Calendar,
      label: "通所予定管理",
      href: "#",
      children: [
        { icon: Calendar, label: "予定管理", href: "#" },
        { icon: LayoutGrid, label: "席割り当て管理", href: "#" },
      ],
    },
    { icon: ClipboardList, label: "通所実績管理", href: "#", active: true },
    { icon: FileOutput, label: "帳票出力", href: "#" },
  ]

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
  }

  const overlayVariants = {
    open: { opacity: 0.5, transition: { duration: 0.3 } },
    closed: { opacity: 0, transition: { duration: 0.3 } },
  }

  const renderMenuItem = (item: MenuItem, index: number, level = 0) => {
    const isExpanded = expandedItems.includes(item.label)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={`${item.label}-${index}`} className="w-full">
        <a
          href={item.href}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
            item.active ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100",
            !isOpen && "justify-center px-2",
            level > 0 && "ml-4 pl-2",
          )}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault()
              if (isOpen) {
                toggleExpand(item.label)
              }
            }
          }}
        >
          <item.icon className={cn("h-5 w-5", !isOpen && "mx-auto")} />

          {isOpen && (
            <>
              <span className="ml-3 flex-1">{item.label}</span>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(item.label)
                  }}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
            </>
          )}

          {!isOpen && hasChildren && (
            <div className="absolute left-full ml-6 hidden rounded-md bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
              {item.label}
            </div>
          )}
        </a>

        {isOpen && hasChildren && isExpanded && (
          <div className="ml-2 mt-1 space-y-1 border-l border-gray-200 pl-2">
            {item.children!.map((child, childIndex) => renderMenuItem(child, childIndex, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {isMobile && isOpen && (
        <motion.div
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={overlayVariants}
          className="fixed inset-0 z-40 bg-black"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={isMobile ? sidebarVariants : {}}
        className={cn(
          "w-64 bg-white shadow-lg transition-all duration-300 ease-in-out",
          isMobile
            ? "fixed inset-y-0 left-0 z-50 pt-16"
            : isOpen
              ? "relative translate-x-0"
              : "relative -translate-x-full lg:w-20",
        )}
      >
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        <div className="space-y-4 py-4">
          <div className="px-4 py-2">
            {isOpen && <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight text-gray-800">メニュー</h2>}
            <div className="space-y-1">{menuItems.map((item, index) => renderMenuItem(item, index))}</div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
