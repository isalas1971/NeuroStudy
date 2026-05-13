"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Timer, Flame, Star, MessageSquare } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { StudyPet } from "@/components/gamification/study-pet"
import { QuickActions } from "./quick-actions"
import { UpcomingTasks } from "./upcoming-tasks"
import { WeeklyProgress } from "./weekly-progress"
import { WhatsNext } from "@/components/accessibility/whats-next"
import { FocusModeToggle, FocusModeWrapper } from "@/components/accessibility/focus-mode"
import { TextToSpeech } from "@/components/accessibility/text-to-speech"

interface TeacherMsg {
  id: string
  content: string
  subject_name: string
  teacher_name: string
  teacher_email: string
  created_at: string
}

export function DashboardView() {
  const { settings, gamification } = useAccessibility()
  const { user } = useSupabaseAuth()
  const supabase = getSupabaseClient()
  const [teacherMsgs, setTeacherMsgs] = useState<TeacherMsg[]>([])
  const [petModalOpen, setPetModalOpen] = useState(false)

  const loadMsgs = useCallback(async () => {
    if (!user || !supabase) return

    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("space_id")
      .eq("student_id", user.id)
    if (!memberships?.length) return

    const spaceIds = memberships.map((m) => m.space_id)

    const { data: msgs } = await supabase
      .from("teacher_messages")
      .select("id, content, created_at, space_id")
      .in("space_id", spaceIds)
      .eq("recipient_all", true)
      .order("created_at", { ascending: false })
      .limit(3)
    if (!msgs?.length) return

    // Get read status
    const { data: reads } = await supabase
      .from("message_recipients")
      .select("message_id")
      .eq("student_id", user.id)
      .in("message_id", msgs.map((m) => m.id))
    const readSet = new Set((reads ?? []).map((r) => r.message_id))

    // Only show unread
    const unread = msgs.filter((m) => !readSet.has(m.id))
    if (!unread.length) return

    // Get space info
    const { data: spaces } = await supabase
      .from("teacher_spaces")
      .select("id, subject_name, teacher_id")
      .in("id", spaceIds)
    const spaceMap = Object.fromEntries((spaces ?? []).map((s) => [s.id, s.subject_name]))
    const teacherIds = [...new Set((spaces ?? []).map((s) => s.teacher_id))]
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", teacherIds)
    const teacherMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, { name: p.name ?? "Docente", email: p.email ?? "" }]))
    const spaceTeacherMap = Object.fromEntries((spaces ?? []).map((s) => [s.id, teacherMap[s.teacher_id] ?? { name: "Docente", email: "" }]))

    setTeacherMsgs(unread.map((m) => ({
      id: m.id,
      content: m.content,
      subject_name: spaceMap[m.space_id] ?? "",
      teacher_name: spaceTeacherMap[m.space_id]?.name ?? "Docente",
      teacher_email: spaceTeacherMap[m.space_id]?.email ?? "",
      created_at: m.created_at,
    })))
  }, [user, supabase])

  useEffect(() => { loadMsgs() }, [loadMsgs])

  const rawName = user?.name
  const displayName = (rawName && !rawName.includes("@"))
    ? rawName
    : user?.email?.split("@")[0] ?? "Alumno"
  const firstName = displayName.split(" ")[0]
  const streak = gamification.streak || 7

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 17) return "Buenas tardes"
    return "Buenas noches"
  }

  const greetingText = `${getGreeting()}, ${firstName}. ¿Listo para aprender algo nuevo hoy?`

  return (
    <div className={cn(
      "space-y-6",
      settings.increasedSpacing && "space-y-8",
      settings.focusMode && "focus-mode-active"
    )}>
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className={cn(
              "text-2xl font-bold text-foreground",
              settings.dyslexiaMode && "tracking-wide"
            )}>
              {getGreeting()}, {firstName}
            </h1>
            {(settings.textToSpeech || settings.dyslexiaMode) && (
              <TextToSpeech text={greetingText} />
            )}
          </div>
          <p className={cn(
            "text-muted-foreground mt-1",
            settings.dyslexiaMode && "tracking-wide leading-relaxed"
          )}>
            {"¿Listo para aprender algo nuevo hoy?"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {settings.autismMode && <FocusModeToggle />}
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">{streak}</span>
          </div>
        </div>
      </div>

      {/* Points display */}
      <FocusModeWrapper>
        <div className="flex items-center justify-center gap-2 py-2">
          <Star className="h-5 w-5 text-amber-500" />
          <span className={cn(
            "text-lg font-semibold text-amber-600",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            {gamification.points} Puntos
          </span>
        </div>
      </FocusModeWrapper>

      {/* Teacher Messages */}
      {teacherMsgs.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className={cn("text-sm font-semibold text-primary", settings.dyslexiaMode && "tracking-wide")}>
                  Mensajes de tus docentes
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {teacherMsgs.length}
                </span>
              </div>
              <Link href="/school" className="text-xs text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {teacherMsgs.slice(0, 2).map((msg) => (
                <div key={msg.id} className="p-2.5 rounded-lg bg-background/80 border border-primary/10">
                  <div className="flex flex-col gap-0.5 mb-1">
                    <span className={cn("text-xs font-semibold text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                      {msg.teacher_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.teacher_email && `${msg.teacher_email} · `}{msg.subject_name}
                    </span>
                  </div>
                  <p className={cn("text-sm text-foreground line-clamp-2", settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's Next (Autism Mode) */}
      {settings.autismMode && <WhatsNext />}

      {/* Study CTA Card */}
      <Card className={cn(
        "border-0 bg-gradient-to-br from-primary/10 to-primary/5",
        settings.autismMode && "bg-primary/5",
        settings.adhdMode && "from-amber-50 via-orange-50 to-primary/10"
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className={cn(
                "text-lg font-semibold text-foreground",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                Comenzar sesión de estudio
              </h2>
              <p className={cn(
                "text-sm text-muted-foreground mt-1",
                settings.dyslexiaMode && "leading-relaxed"
              )}>
                {settings.adhdMode
                  ? `Sesión corta de ${settings.studySessionDuration} min lista`
                  : `Concentrate ${settings.studySessionDuration} minutos con descansos`
                }
              </p>
              <Link href="/study">
                <Button className={cn(
                  "mt-3 gap-2",
                  settings.adhdMode && "bg-amber-500 hover:bg-amber-600"
                )}>
                  <Timer className="h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
            <div className={cn(
              "hidden sm:block",
              settings.simplifiedUI && "hidden"
            )}>
              <button
                onClick={() => setPetModalOpen(true)}
                className="focus:outline-none hover:opacity-80 transition-opacity"
                aria-label="Ver mascota"
              >
                <StudyPet compact />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <FocusModeWrapper>
        {!settings.simplifiedUI && <QuickActions />}
      </FocusModeWrapper>

      {/* Upcoming Tasks */}
      <UpcomingTasks />

      {/* Weekly Progress */}
      <FocusModeWrapper>
        <WeeklyProgress />
      </FocusModeWrapper>

      {/* Study Pet Card - Mobile */}
      <FocusModeWrapper>
        <div className={cn(
          "sm:hidden",
          settings.simplifiedUI && "hidden"
        )}>
          <StudyPet />
        </div>
      </FocusModeWrapper>

      {/* Mode-specific tips */}
      {settings.adhdMode && !settings.focusMode && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <p className={cn(
              "text-sm text-amber-800",
              settings.dyslexiaMode && "tracking-wide leading-relaxed"
            )}>
              <strong>Consejo TDAH:</strong> Un paso a la vez. Tus sesiones de {settings.studySessionDuration} minutos
              están diseñadas para ayudarte a concentrarte mejor. ¡Usá micro-tareas para dividir tu trabajo!
            </p>
          </CardContent>
        </Card>
      )}

      {settings.dyslexiaMode && !settings.focusMode && (
        <Card className="border-sky-200 bg-sky-50/50">
          <CardContent className="p-4">
            <p className={cn(
              "text-sm text-sky-800",
              settings.dyslexiaMode && "tracking-wide leading-relaxed"
            )}>
              <strong>Consejo de Lectura:</strong> Buscá el ícono de altavoz junto a los bloques de texto
              para escuchar el contenido en voz alta. La fuente OpenDyslexic facilita la lectura.
            </p>
          </CardContent>
        </Card>
      )}

      {settings.autismMode && !settings.focusMode && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <p className={cn(
              "text-sm text-emerald-800",
              settings.dyslexiaMode && "tracking-wide leading-relaxed"
            )}>
              <strong>Consejo de Estructura:</strong> Usá la sección {"\"¿Qué viene después?\""} para ver tu
              agenda. Activá el Modo Foco para reducir distracciones cuando necesites concentrarte.
            </p>
          </CardContent>
        </Card>
      )}
      <Dialog open={petModalOpen} onOpenChange={setPetModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mi Mascota de Estudio</DialogTitle>
          </DialogHeader>
          <StudyPet />
        </DialogContent>
      </Dialog>
    </div>
  )
}
