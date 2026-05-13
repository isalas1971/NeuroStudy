"use client"

import Link from "next/link"
import { Timer, Calendar, BarChart3, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

const actions = [
  {
    href: "/study",
    label: "Estudiar",
    icon: Timer,
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    href: "/calendar",
    label: "Calendario",
    icon: Calendar,
    color: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  },
  {
    href: "/progress",
    label: "Progreso",
    icon: BarChart3,
    color: "bg-accent/50 text-accent-foreground hover:bg-accent/70",
  },
  {
    href: "/school",
    label: "Mi Escuela",
    icon: BookOpen,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
]

export function QuickActions() {
  const { settings } = useAccessibility()

  return (
    <div className={cn(
      "grid grid-cols-4 gap-2",
      settings.simplifiedUI && "grid-cols-2"
    )}>
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
              action.color,
              !settings.reducedAnimations && "transition-all duration-200",
              settings.simplifiedUI && "p-4"
            )}
          >
            <Icon className={cn(
              "h-5 w-5",
              settings.simplifiedUI && "h-6 w-6"
            )} />
            <span className={cn(
              "text-xs font-medium text-center",
              settings.dyslexiaMode && "tracking-wide",
              settings.simplifiedUI && "text-sm"
            )}>
              {action.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
