"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Timer, BarChart3, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/study", label: "Estudio", icon: Timer },
  { href: "/progress", label: "Progreso", icon: BarChart3 },
  { href: "/school", label: "Escuela", icon: School },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { settings } = useAccessibility()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-sm border-t border-border",
        "pb-safe"
      )}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl",
                "min-w-[56px] transition-colors",
                settings.reducedAnimations ? "" : "transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className={cn(
                "text-[11px] font-medium",
                settings.dyslexiaMode && "tracking-wider"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

    </nav>
  )
}
