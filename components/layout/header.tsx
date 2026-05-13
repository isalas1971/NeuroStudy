"use client"

import { useState } from "react"
import Link from "next/link"
import { Settings, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAccessibility } from "@/contexts/accessibility-context"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { NotificationsPanel, NotificationBadge } from "@/components/notifications/notifications-panel"
import { cn } from "@/lib/utils"
import { NeuroStudyLogo } from "@/components/ui/neurostudy-logo"

interface HeaderProps {
  title?: string
  showBack?: boolean
}

export function Header({ title = "NeuroStudy" }: HeaderProps) {
  const { settings } = useAccessibility()
  const { user } = useSupabaseAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <NeuroStudyLogo size={32} className="rounded-lg overflow-hidden" />
            <span className={cn(
              "font-semibold",
              settings.dyslexiaMode && "tracking-wide"
            )} style={{ color: "#1B3A5C" }}>
              Neuro<span style={{ color: "#4191A8" }}>Study</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full relative"
              aria-label="Notificaciones"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              <NotificationBadge />
            </Button>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="Ajustes"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-transparent hover:border-primary/20 transition-colors cursor-pointer">
                <AvatarImage src={user?.profilePicture || undefined} alt={user?.name || "Perfil"} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user?.name ? getInitials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <NotificationsPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </>
  )
}
