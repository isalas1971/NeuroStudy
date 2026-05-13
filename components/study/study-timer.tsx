"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Play, Pause, RotateCcw, Coffee, Target, Sparkles, ListTodo, Plus, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { BackgroundSoundPlayer } from "./background-sound-player"

type TimerState = "idle" | "running" | "paused" | "break"

interface MicroTask {
  id: string
  text: string
  completed: boolean
}

const breakActivities = [
  { activity: "Estirá los brazos por encima de la cabeza", duration: "30 segundos" },
  { activity: "Tomá 5 respiraciones profundas", duration: "1 minuto" },
  { activity: "Mirá algo lejos por la ventana", duration: "30 segundos" },
  { activity: "Rolá los hombros hacia atrás", duration: "30 segundos" },
  { activity: "Levantate y caminá un poco", duration: "2 minutos" },
  { activity: "Hacé 5 rotaciones suaves de cuello", duration: "30 segundos" },
  { activity: "Sacudí las manos y muñecas", duration: "30 segundos" },
  { activity: "Cerrá los ojos y relajate", duration: "1 minuto" },
]

export function StudyTimer() {
  const { settings, updateSetting, addPoints, gamification } = useAccessibility()
  const sessionDuration = settings.studySessionDuration * 60
  const breakDuration = settings.breakDuration * 60

  const [timeLeft, setTimeLeft] = useState(sessionDuration)
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [studyGoal, setStudyGoal] = useState("")
  const [currentBreakActivity, setCurrentBreakActivity] = useState(breakActivities[0])
  const [microTasks, setMicroTasks] = useState<MicroTask[]>([])
  const [newTaskText, setNewTaskText] = useState("")
  const [soundType, setSoundType] = useState<"brown_noise" | "white_noise" | "rain" | "forest">("brown_noise")

  useEffect(() => {
    setTimeLeft(sessionDuration)
  }, [sessionDuration])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerState === "running" || timerState === "break") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerState === "running") {
              setSessionsCompleted((s) => s + 1)
              addPoints(10)
              setTimerState("break")
              setCurrentBreakActivity(breakActivities[Math.floor(Math.random() * breakActivities.length)])
              return breakDuration
            } else {
              setTimerState("idle")
              return sessionDuration
            }
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => { if (interval) clearInterval(interval) }
  }, [timerState, sessionDuration, breakDuration, addPoints])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = useCallback(() => setTimerState("running"), [])
  const handlePause = useCallback(() => setTimerState("paused"), [])
  const handleResume = useCallback(() => setTimerState("running"), [])
  const handleReset = useCallback(() => {
    setTimerState("idle")
    setTimeLeft(sessionDuration)
  }, [sessionDuration])

  const addMicroTask = () => {
    if (!newTaskText.trim()) return
    setMicroTasks([...microTasks, { id: Date.now().toString(), text: newTaskText, completed: false }])
    setNewTaskText("")
  }

  const toggleMicroTask = (id: string) => {
    setMicroTasks(microTasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
    const task = microTasks.find(t => t.id === id)
    if (task && !task.completed) addPoints(2)
  }

  const removeMicroTask = (id: string) => {
    setMicroTasks(microTasks.filter(task => task.id !== id))
  }

  const progress = timerState === "break"
    ? ((breakDuration - timeLeft) / breakDuration) * 100
    : ((sessionDuration - timeLeft) / sessionDuration) * 100

  const isAdhdMode = settings.adhdMode

  return (
    <div className={cn("space-y-6", settings.increasedSpacing && "space-y-8")}>
      {/* Timer Card */}
      <Card className={cn(
        "border-0 overflow-hidden",
        timerState === "break"
          ? "bg-gradient-to-br from-green-50 to-green-100/50 .theme-dark_from-green-900/20 .theme-dark_to-green-800/10"
          : isAdhdMode
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-primary/10"
            : "bg-gradient-to-br from-primary/5 to-primary/10",
        settings.autismMode && "bg-muted/30"
      )}>
        <CardContent className={cn("p-6 sm:p-8", isAdhdMode && "p-8 sm:p-10")}>
          <div className="flex flex-col items-center">
            {/* Estado */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full mb-4",
              timerState === "break"
                ? "bg-green-100 text-green-700"
                : isAdhdMode
                  ? "bg-amber-100 text-amber-700"
                  : "bg-primary/10 text-primary",
              isAdhdMode && "text-base font-semibold"
            )}>
              {timerState === "break" ? (
                <>
                  <Coffee className={cn("h-4 w-4", isAdhdMode && "h-5 w-5")} />
                  <span className={cn("text-sm font-medium", settings.dyslexiaMode && "tracking-wide", isAdhdMode && "text-base")}>
                    Tiempo de Descanso
                  </span>
                </>
              ) : (
                <>
                  {isAdhdMode ? <Sparkles className="h-5 w-5" /> : <Target className="h-4 w-4" />}
                  <span className={cn("text-sm font-medium", settings.dyslexiaMode && "tracking-wide", isAdhdMode && "text-base")}>
                    {timerState === "idle" ? "Listo para Concentrarme" : "Sesión de Estudio"}
                  </span>
                </>
              )}
            </div>

            {/* Círculo del timer */}
            <div className={cn("relative", isAdhdMode ? "w-56 h-56 sm:w-64 sm:h-64" : "w-48 h-48 sm:w-56 sm:h-56")}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
                  strokeWidth={isAdhdMode ? "8" : "6"} className="text-muted" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
                  strokeWidth={isAdhdMode ? "8" : "6"} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className={cn(
                    timerState === "break" ? "text-green-500" :
                    isAdhdMode ? "text-amber-500" : "text-primary",
                    !settings.reducedAnimations && "transition-all duration-1000"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "font-bold text-foreground tabular-nums",
                  isAdhdMode ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl",
                  settings.dyslexiaMode && "tracking-wider"
                )}>
                  {formatTime(timeLeft)}
                </span>
                <span className={cn("text-muted-foreground mt-1", isAdhdMode ? "text-base" : "text-sm")}>
                  {settings.studySessionDuration} min
                </span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3 mt-6">
              {timerState === "idle" && (
                <Button size="lg" onClick={handleStart} className={cn("gap-2", isAdhdMode && "px-10 py-6 text-lg")}>
                  <Play className={cn("h-5 w-5", isAdhdMode && "h-6 w-6")} />
                  Empezar
                </Button>
              )}
              {timerState === "running" && (
                <>
                  <Button size="lg" variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                  <Button size="lg" onClick={handlePause} className={cn("gap-2", isAdhdMode && "px-10")}>
                    <Pause className="h-5 w-5" />
                    Pausar
                  </Button>
                </>
              )}
              {timerState === "paused" && (
                <>
                  <Button size="lg" variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                  <Button size="lg" onClick={handleResume} className={cn("gap-2", isAdhdMode && "px-10")}>
                    <Play className="h-5 w-5" />
                    Continuar
                  </Button>
                </>
              )}
              {timerState === "break" && (
                <Button size="lg" variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Saltar Descanso
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actividad de descanso guiado (modo TDAH) */}
      {timerState === "break" && settings.guidedBreaks && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-base font-semibold text-green-800", settings.dyslexiaMode && "tracking-wide")}>
              Actividad de Descanso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-green-700 font-medium", settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
                  {currentBreakActivity.activity}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Duración: {currentBreakActivity.duration}
                </p>
              </div>
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentBreakActivity(breakActivities[Math.floor(Math.random() * breakActivities.length)])}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Otra actividad
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sonido de Fondo */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-base font-semibold", settings.dyslexiaMode && "tracking-wide")}>
              Sonido de Fondo
            </CardTitle>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
              aria-label="Activar sonido de fondo"
            />
          </div>
        </CardHeader>
        {settings.soundEnabled && (
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {(["brown_noise", "white_noise", "rain", "forest"] as const).map((sound) => (
                <Button
                  key={sound}
                  variant={soundType === sound ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSoundType(sound)}
                >
                  {sound === "brown_noise" && "Ruido Café"}
                  {sound === "white_noise" && "Ruido Blanco"}
                  {sound === "rain" && "Lluvia"}
                  {sound === "forest" && "Bosque"}
                </Button>
              ))}
            </div>
            <BackgroundSoundPlayer
              soundType={soundType}
              volume={settings.soundVolume}
              onVolumeChange={(volume) => updateSetting("soundVolume", volume)}
              enabled={settings.soundEnabled}
              onEnabledChange={(enabled) => updateSetting("soundEnabled", enabled)}
              timerRunning={timerState === "running"}
            />
          </CardContent>
        )}
      </Card>

      {/* Micro-Tareas (modo TDAH) */}
      {settings.microTasksEnabled && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className={cn(
              "text-base font-semibold flex items-center gap-2",
              settings.dyslexiaMode && "tracking-wide"
            )}>
              <ListTodo className="h-4 w-4 text-amber-500" />
              Micro-Tareas
              <span className="text-xs font-normal text-muted-foreground ml-1">
                (Dividí las tareas en pasos pequeños)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMicroTask()}
                placeholder="Agregar tarea pequeña..."
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground",
                  "text-sm placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  settings.dyslexiaMode && "tracking-wide"
                )}
              />
              <Button onClick={addMicroTask} size="sm" className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {microTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border",
                    task.completed && "opacity-60"
                  )}
                >
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleMicroTask(task.id)}>
                    {task.completed
                      ? <Check className="h-4 w-4 text-green-500" />
                      : <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                    }
                  </Button>
                  <span className={cn(
                    "flex-1 text-sm text-foreground",
                    task.completed && "line-through text-muted-foreground",
                    settings.dyslexiaMode && "tracking-wide"
                  )}>
                    {task.text}
                  </span>
                  <Button
                    variant="ghost" size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMicroTask(task.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {microTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin tareas aún. ¡Agregá pasos pequeños y alcanzables!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objetivo de la sesión */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <label className={cn("block text-sm font-medium text-foreground mb-2", settings.dyslexiaMode && "tracking-wide")}>
            ¿Cuál es tu objetivo para esta sesión?
          </label>
          <input
            type="text"
            value={studyGoal}
            onChange={(e) => setStudyGoal(e.target.value)}
            placeholder="ej., Completar el Capítulo 5 de Matemáticas"
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground",
              "text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              settings.dyslexiaMode && "tracking-wide leading-relaxed"
            )}
          />
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{sessionsCompleted}</p>
              <p className={cn("text-xs text-muted-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Sesiones Hoy
              </p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {Math.round((sessionsCompleted * settings.studySessionDuration) / 60 * 10) / 10}h
              </p>
              <p className={cn("text-xs text-muted-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Tiempo de Estudio
              </p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{gamification.points}</p>
              <p className={cn("text-xs text-muted-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Puntos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip TDAH */}
      {settings.adhdMode && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className={cn("text-sm text-foreground", settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
              <strong className="text-amber-500">Consejo TDAH:</strong>{" "}
              Tu sesión está configurada a {settings.studySessionDuration} minutos para mejor concentración.
              ¡Usá las micro-tareas para dividir tu trabajo en pasos pequeños y alcanzables!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
