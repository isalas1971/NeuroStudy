"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ChevronRight, Calendar, BookOpen, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

interface ScheduleItem {
  id: string
  time: string
  title: string
  type: "study" | "break" | "task" | "event"
  duration: string
}

// Sample schedule - in a real app this would come from user data
const getScheduleItems = (): ScheduleItem[] => {
  const now = new Date()
  const currentHour = now.getHours()
  
  return [
    {
      id: "1",
      time: `${currentHour}:00`,
      title: "Current Study Session",
      type: "study",
      duration: "25 min",
    },
    {
      id: "2",
      time: `${currentHour}:25`,
      title: "Short Break",
      type: "break",
      duration: "5 min",
    },
    {
      id: "3",
      time: `${currentHour}:30`,
      title: "Math Homework",
      type: "task",
      duration: "45 min",
    },
    {
      id: "4",
      time: `${currentHour + 1}:15`,
      title: "Long Break",
      type: "break",
      duration: "15 min",
    },
    {
      id: "5",
      time: `${currentHour + 1}:30`,
      title: "Science Reading",
      type: "study",
      duration: "30 min",
    },
  ]
}

const typeStyles = {
  study: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: BookOpen,
    iconColor: "text-primary",
  },
  break: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: Coffee,
    iconColor: "text-green-600",
  },
  task: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Calendar,
    iconColor: "text-amber-600",
  },
  event: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: Calendar,
    iconColor: "text-purple-600",
  },
}

interface WhatsNextProps {
  showFull?: boolean
}

export function WhatsNext({ showFull = false }: WhatsNextProps) {
  const { settings } = useAccessibility()
  const scheduleItems = getScheduleItems()
  const displayItems = showFull ? scheduleItems : scheduleItems.slice(0, 3)

  if (!settings.autismMode && !showFull) return null

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className={cn(
          "text-base font-semibold flex items-center gap-2",
          settings.dyslexiaMode && "tracking-wide"
        )}>
          <Clock className="h-4 w-4 text-primary" />
          {"What's Coming Up"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayItems.map((item, index) => {
            const style = typeStyles[item.type]
            const Icon = style.icon
            const isFirst = index === 0
            
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  style.bg,
                  style.border,
                  isFirst && "ring-2 ring-primary/20"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-white",
                  style.iconColor
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium text-foreground truncate",
                    settings.dyslexiaMode && "tracking-wide"
                  )}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {item.time}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {item.duration}
                    </span>
                  </div>
                </div>
                
                {isFirst && (
                  <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full">
                    Now
                  </span>
                )}
                
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          })}
        </div>
        
        {!showFull && scheduleItems.length > 3 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            +{scheduleItems.length - 3} more items today
          </p>
        )}
      </CardContent>
    </Card>
  )
}
