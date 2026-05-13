"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Bell, BookOpen, Calendar, AlertCircle, Clock, CheckCircle2, X, 
  ChevronRight, Sparkles 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

interface Notification {
  id: string
  type: "reminder" | "exam" | "gentle" | "achievement" | "info"
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "reminder",
    title: "Study Reminder",
    message: "Time for your daily Math practice! You're on a 7-day streak.",
    time: "5 min ago",
    read: false,
  },
  {
    id: "2",
    type: "exam",
    title: "Upcoming Exam",
    message: "Chemistry exam in 3 days. Would you like to review your notes?",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "gentle",
    title: "Friendly Check-in",
    message: "You haven't studied today yet. Even 10 minutes can help!",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "achievement",
    title: "Achievement Unlocked!",
    message: "You completed 5 study sessions this week. Great job!",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "New Feature",
    message: "Try the new focus mode in settings for distraction-free studying.",
    time: "2 days ago",
    read: true,
  },
]

const notificationIcons: Record<Notification["type"], { icon: React.ElementType; color: string; bg: string }> = {
  reminder: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
  exam: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-100" },
  gentle: { icon: AlertCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  achievement: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-100" },
  info: { icon: BookOpen, color: "text-slate-600", bg: "bg-slate-100" },
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { settings } = useAccessibility()
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl",
          "transform transition-transform duration-300 ease-out",
          settings.reducedAnimations && "transition-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className={cn(
                "text-lg font-semibold",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground/70">No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon: Icon, color, bg } = notificationIcons[notification.type]
                
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "border-border/50 transition-colors cursor-pointer hover:bg-muted/50",
                      !notification.read && "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          bg
                        )}>
                          <Icon className={cn("h-5 w-5", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={cn(
                              "font-medium text-sm",
                              settings.dyslexiaMode && "tracking-wide",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                dismissNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className={cn(
                            "text-sm text-muted-foreground mt-0.5 line-clamp-2",
                            settings.dyslexiaMode && "tracking-wide leading-relaxed"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Button variant="outline" className="w-full gap-2">
              Notification Settings
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Badge component for header
export function NotificationBadge() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length
  
  if (unreadCount === 0) return null
  
  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )
}
