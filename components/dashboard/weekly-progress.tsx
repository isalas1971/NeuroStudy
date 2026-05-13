"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

const weeklyData = [
  { day: "Lun", hours: 2.5, target: 2 },
  { day: "Mar", hours: 1.5, target: 2 },
  { day: "Mié", hours: 3, target: 2 },
  { day: "Jue", hours: 2, target: 2 },
  { day: "Vie", hours: 1, target: 2 },
  { day: "Sáb", hours: 0.5, target: 1 },
  { day: "Dom", hours: 0, target: 1 },
]

export function WeeklyProgress() {
  const { settings } = useAccessibility()
  const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0)
  const maxHours = Math.max(...weeklyData.map(d => Math.max(d.hours, d.target)))

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-base font-semibold",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            Esta Semana
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalHours.toFixed(1)}h estudiadas
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-24">
          {weeklyData.map((data) => {
            const heightPercent = maxHours > 0 ? (data.hours / maxHours) * 100 : 0
            const metTarget = data.hours >= data.target
            
            return (
              <div key={data.day} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex items-end justify-center h-16">
                  <div
                    className={cn(
                      "w-4 sm:w-6 rounded-t-md",
                      metTarget ? "bg-primary" : "bg-primary/40",
                      !settings.reducedAnimations && "transition-all duration-300"
                    )}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs text-muted-foreground mt-1",
                  settings.dyslexiaMode && "tracking-wide"
                )}>
                  {data.day}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Meta alcanzada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <span>En progreso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
