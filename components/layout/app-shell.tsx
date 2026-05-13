"use client"

import { type ReactNode } from "react"
import { Header } from "./header"
import { BottomNavigation } from "./bottom-navigation"
import { useAccessibility } from "@/contexts/accessibility-context"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: ReactNode
  title?: string
  hideNavigation?: boolean
}

export function AppShell({ children, title, hideNavigation = false }: AppShellProps) {
  const { settings } = useAccessibility()

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-background",
        settings.dyslexiaMode && "leading-relaxed tracking-wide",
        settings.autismMode && "transition-none"
      )}
    >
      <Header title={title} />
      
      {/* Main content area with proper scrolling */}
      <main 
        className={cn(
          "flex-1 overflow-y-auto",
          // Padding bottom accounts for bottom navigation (64px=h-16) + safe area + generous extra spacing (80px extra)
          hideNavigation ? "pb-8" : "pb-36",
          settings.increasedSpacing ? "px-5 pt-5" : "px-4 pt-4"
        )}
      >
        <div className="max-w-lg mx-auto w-full">
          {children}
        </div>
      </main>
      
      {!hideNavigation && <BottomNavigation />}
    </div>
  )
}
