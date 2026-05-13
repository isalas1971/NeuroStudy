"use client"

import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

export function FocusModeToggle() {
  const { settings, updateSetting } = useAccessibility()

  if (!settings.autismMode) return null

  return (
    <Button
      variant={settings.focusMode ? "default" : "outline"}
      size="sm"
      onClick={() => updateSetting("focusMode", !settings.focusMode)}
      className={cn(
        "gap-2",
        settings.focusMode && "bg-primary/80"
      )}
      aria-label={settings.focusMode ? "Exit focus mode" : "Enter focus mode"}
    >
      {settings.focusMode ? (
        <>
          <EyeOff className="h-4 w-4" />
          Exit Focus
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Focus Mode
        </>
      )}
    </Button>
  )
}

// Focus mode wrapper that dims non-essential UI
interface FocusModeWrapperProps {
  children: React.ReactNode
  isEssential?: boolean
}

export function FocusModeWrapper({ children, isEssential = false }: FocusModeWrapperProps) {
  const { settings } = useAccessibility()

  if (!settings.focusMode || isEssential) {
    return <>{children}</>
  }

  return (
    <div className={cn(
      "transition-opacity duration-300",
      settings.focusMode && "opacity-30 hover:opacity-100"
    )}>
      {children}
    </div>
  )
}
