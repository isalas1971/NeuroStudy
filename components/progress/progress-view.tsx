"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { TrendingUp, Clock, Target, Award, Flame } from "lucide-react"

const weeklyStats = [
  { day: "Lun", hours: 2.5 },
  { day: "Mar", hours: 1.5 },
  { day: "Mié", hours: 3 },
  { day: "Jue", hours: 2 },
  { day: "Vie", hours: 1 },
  { day: "Sáb", hours: 0.5 },
  { day: "Dom", hours: 0 },
]

const subjectBreakdown = [
  { subject: "Matemáticas", hours: 4.5, color: "bg-blue-500" },
  { subject: "Literatura", hours: 2.5, color: "bg-purple-500" },
  { subject: "Ciencias", hours: 2, color: "bg-green-500" },
  { subject: "Historia", hours: 1.5, color: "bg-amber-500" },
]

const achievements = [
  { id: "1", title: "Primera sesión", description: "Completá tu primera sesión de estudio", unlocked: true },
  { id: "2", title: "Guerrero semanal", description: "Estudiá todos los días durante una semana", unlocked: true },
  { id: "3", title: "Maestro del foco", description: "Completá 10 sesiones sin pausas", unlocked: false },
  { id: "4", title: "Noctámbulo", description: "Estudiá después de las 21hs", unlocked: true },
]

export function ProgressView() {
  const { settings } = useAccessibility()
  const totalHours = weeklyStats.reduce((sum, d) => sum + d.hours, 0)
  const maxHours = Math.max(...weeklyStats.map(d => d.hours))
  const streak = 7

  return (
    <div className={cn("space-y-6", settings.increasedSpacing && "space-y-8")}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}h</p>
              <p className={cn(
                "text-xs text-muted-foreground",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                Esta semana
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Flame className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{streak}</p>
              <p className={cn(
                "text-xs text-muted-foreground",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                Racha de días
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">85%</p>
              <p className={cn(
                "text-xs text-muted-foreground",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                Objetivos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">+12%</p>
              <p className={cn(
                "text-xs text-muted-foreground",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                vs sem. anterior
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className={cn(
            "text-base font-semibold",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            Horas de estudio esta semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyStats.map((data) => {
              const heightPercent = maxHours > 0 ? (data.hours / maxHours) * 100 : 0

              return (
                <div key={data.day} className="flex flex-col items-center flex-1">
                  <div className="relative w-full flex items-end justify-center h-24">
                    <div
                      className={cn(
                        "w-full max-w-8 rounded-t-md bg-primary",
                        !settings.reducedAnimations && "transition-all duration-300"
                      )}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs text-muted-foreground mt-2",
                    settings.dyslexiaMode && "tracking-wide"
                  )}>
                    {data.day}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {data.hours}h
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className={cn(
            "text-base font-semibold",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            Por materia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjectBreakdown.map((subject) => {
            const percentage = (subject.hours / totalHours) * 100
            return (
              <div key={subject.subject} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    "font-medium",
                    settings.dyslexiaMode && "tracking-wide"
                  )}>
                    {subject.subject}
                  </span>
                  <span className="text-muted-foreground">{subject.hours}h</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      subject.color,
                      !settings.reducedAnimations && "transition-all duration-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className={cn(
            "text-base font-semibold flex items-center gap-2",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            <Award className="h-5 w-5" />
            Logros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                achievement.unlocked ? "bg-primary/5" : "bg-muted/30 opacity-60"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                achievement.unlocked ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Award className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  settings.dyslexiaMode && "tracking-wide"
                )}>
                  {achievement.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
              {achievement.unlocked && (
                <span className="text-xs text-primary font-medium">Desbloqueado</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
