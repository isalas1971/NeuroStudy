"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import {
  Calendar, Clock, AlertCircle, CheckCircle2, MessageSquare, Info,
  BookOpen, Plus, Loader2, Check, X, Star,
} from "lucide-react"

// ─── Static mock attendance (will be replaced by real data in a future sprint) ─

const attendanceData = { totalDays: 120, present: 112, absent: 5, late: 3 }

const recentAttendance = [
  { date: "23 Abr", status: "present" as const },
  { date: "22 Abr", status: "present" as const },
  { date: "21 Abr", status: "late" as const },
  { date: "20 Abr", status: "present" as const },
  { date: "19 Abr", status: "absent" as const },
  { date: "18 Abr", status: "present" as const },
  { date: "17 Abr", status: "present" as const },
]

const statusColors = { present: "bg-green-500", absent: "bg-red-400", late: "bg-amber-500" }
const statusIcons = { present: CheckCircle2, absent: AlertCircle, late: Clock }

// ─── Types ────────────────────────────────────────────────────────────────────

interface JoinedSpace {
  space_id: string
  school_name: string
  subject_name: string
  space_code: string
}

interface TeacherNote {
  id: string
  content: string
  created_at: string
  space_id: string
  school_name: string
  subject_name: string
  teacher_name: string
  teacher_email: string
  is_read: boolean
}

interface PointAward {
  id: string
  points: number
  reason: string | null
  created_at: string
  space_id: string
  subject_name: string
  teacher_name: string
  teacher_email: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SchoolView() {
  const { settings } = useAccessibility()
  const { user } = useSupabaseAuth()
  const supabase = getSupabaseClient()

  const attendanceRate = Math.round((attendanceData.present / attendanceData.totalDays) * 100)
  const showWarning = attendanceRate < 90

  const [spaces, setSpaces] = useState<JoinedSpace[]>([])
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [pointAwards, setPointAwards] = useState<PointAward[]>([])
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)
  const [showJoinInput, setShowJoinInput] = useState(false)

  const loadSpacesAndNotes = useCallback(async () => {
    if (!user || !supabase) { setIsLoadingSpaces(false); return }

    // Load spaces the student has joined
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("space_id")
      .eq("student_id", user.id)

    if (!memberships?.length) { setIsLoadingSpaces(false); return }

    const spaceIds = memberships.map((m) => m.space_id)

    const { data: spacesData } = await supabase
      .from("teacher_spaces")
      .select("id, school_name, subject_name, space_code")
      .in("id", spaceIds)

    setSpaces((spacesData ?? []).map((s) => ({
      space_id: s.id,
      school_name: s.school_name,
      subject_name: s.subject_name,
      space_code: s.space_code,
    })))

    // Load messages for those spaces
    const { data: messages } = await supabase
      .from("teacher_messages")
      .select("id, content, created_at, space_id, recipient_all")
      .in("space_id", spaceIds)
      .eq("recipient_all", true)
      .order("created_at", { ascending: false })
      .limit(20)

    if (messages?.length) {
      const msgIds = messages.map((m) => m.id)
      const { data: reads } = await supabase
        .from("message_recipients")
        .select("message_id")
        .eq("student_id", user.id)
        .in("message_id", msgIds)

      const readSet = new Set((reads ?? []).map((r) => r.message_id))
      const spaceMap = Object.fromEntries(
        (spacesData ?? []).map((s) => [s.id, { school_name: s.school_name, subject_name: s.subject_name }])
      )

      // Get teacher names
      const { data: spaceTeachers } = await supabase
        .from("teacher_spaces")
        .select("id, teacher_id")
        .in("id", spaceIds)

      const teacherIds = [...new Set((spaceTeachers ?? []).map((s) => s.teacher_id))]
      const { data: teacherProfiles } = await supabase
        .from("user_profiles")
        .select("id, name, email")
        .in("id", teacherIds)

      const teacherMap = Object.fromEntries((teacherProfiles ?? []).map((p) => [p.id, { name: p.name, email: p.email ?? "" }]))
      const spaceTeacherMap = Object.fromEntries(
        (spaceTeachers ?? []).map((s) => [s.id, teacherMap[s.teacher_id] ?? { name: "Docente", email: "" }])
      )

      setNotes(messages.map((m) => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        space_id: m.space_id,
        school_name: spaceMap[m.space_id]?.school_name ?? "",
        subject_name: spaceMap[m.space_id]?.subject_name ?? "",
        teacher_name: spaceTeacherMap[m.space_id]?.name ?? "Docente",
        teacher_email: spaceTeacherMap[m.space_id]?.email ?? "",
        is_read: readSet.has(m.id),
      })))

      // Load point awards for this student
      const { data: pointsData } = await supabase
        .from("teacher_point_awards")
        .select("id, points, reason, created_at, space_id")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (pointsData?.length) {
        setPointAwards(pointsData.map((p) => ({
          id: p.id,
          points: p.points,
          reason: p.reason,
          created_at: p.created_at,
          space_id: p.space_id,
          subject_name: spaceMap[p.space_id]?.subject_name ?? "Docente",
          teacher_name: spaceTeacherMap[p.space_id]?.name ?? "Docente",
          teacher_email: spaceTeacherMap[p.space_id]?.email ?? "",
        })))
      }
    }

    setIsLoadingSpaces(false)
  }, [user, supabase])

  useEffect(() => { loadSpacesAndNotes() }, [loadSpacesAndNotes])

  const handleJoinSpace = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code || code.length !== 6 || !user || !supabase) return
    setIsJoining(true)
    setJoinError(null)
    setJoinSuccess(null)

    const { data: space } = await supabase
      .from("teacher_spaces")
      .select("id, school_name, subject_name, space_code, teacher_id")
      .eq("space_code", code)
      .single()

    if (!space) { setJoinError("Código inválido. Verificá que sea correcto."); setIsJoining(false); return }

    const alreadyJoined = spaces.some((s) => s.space_id === space.id)
    if (alreadyJoined) { setJoinError("Ya estás en este espacio."); setIsJoining(false); return }

    const { error } = await supabase
      .from("space_memberships")
      .insert({ space_id: space.id, student_id: user.id })

    if (error) { setJoinError("No se pudo unir al espacio. Intentá nuevamente."); setIsJoining(false); return }

    // Fetch teacher name for the success message
    let teacherLabel = ""
    if (space.teacher_id) {
      const { data: teacherProfile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("id", space.teacher_id)
        .single()
      if (teacherProfile?.name) teacherLabel = ` con ${teacherProfile.name}`
    }

    setSpaces((prev) => [...prev, { space_id: space.id, school_name: space.school_name, subject_name: space.subject_name, space_code: space.space_code }])
    setJoinSuccess(`¡Te uniste a ${space.subject_name} — ${space.school_name}${teacherLabel}!`)
    setJoinCode("")
    setShowJoinInput(false)
    setIsJoining(false)
  }

  const handleMarkRead = async (noteId: string) => {
    if (!user || !supabase) return
    await supabase.from("message_recipients").upsert(
      { message_id: noteId, student_id: user.id },
      { onConflict: "message_id,student_id" }
    )
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, is_read: true } : n))
  }

  const unreadCount = notes.filter((n) => !n.is_read).length

  return (
    <div className={cn("space-y-6", settings.increasedSpacing && "space-y-8")}>

      {/* My Spaces */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-base font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <BookOpen className="h-5 w-5" />
              Mis Espacios
            </CardTitle>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => { setShowJoinInput((v) => !v); setJoinError(null); setJoinSuccess(null) }}>
              <Plus className="h-3.5 w-3.5" />
              Unirse
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showJoinInput && (
            <div className="flex gap-2">
              <Input
                placeholder="Código de espacio (6 letras)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                className="font-mono tracking-widest uppercase"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoinSpace()}
              />
              <Button size="sm" onClick={handleJoinSpace} disabled={isJoining || joinCode.trim().length !== 6} className="gap-1 shrink-0">
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowJoinInput(false); setJoinCode(""); setJoinError(null) }} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {joinError && <p className="text-xs text-destructive">{joinError}</p>}
          {joinSuccess && <p className="text-xs text-green-600">{joinSuccess}</p>}

          {isLoadingSpaces ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : spaces.length === 0 ? (
            <p className={cn("text-sm text-muted-foreground text-center py-4", settings.dyslexiaMode && "tracking-wide")}>
              Ingresá el código de tu docente para unirte a un espacio
            </p>
          ) : (
            <div className="space-y-2">
              {spaces.map((space) => (
                <div key={space.space_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm truncate", settings.dyslexiaMode && "tracking-wide")}>{space.subject_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{space.school_name}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{space.space_code}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Notes / Messages */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className={cn("text-base font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <MessageSquare className="h-5 w-5" />
              Notas de Docentes
            </CardTitle>
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <p className={cn("text-sm text-muted-foreground text-center py-4", settings.dyslexiaMode && "tracking-wide")}>
              Sin notas recientes
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "p-3 rounded-lg border-l-4",
                  note.is_read
                    ? "bg-muted/30 border-muted-foreground/30"
                    : "bg-primary/5 border-primary"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-col gap-0.5">
                    <span className={cn("text-xs font-semibold text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                      {note.teacher_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {note.teacher_email && `${note.teacher_email} · `}{note.subject_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!note.is_read && (
                      <button
                        onClick={() => handleMarkRead(note.id)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Marcar leído
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>
                <p className={cn("text-sm text-foreground", settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
                  {note.content}
                </p>
                {!note.is_read && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] text-primary font-medium">Nuevo</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Puntos del Docente */}
      {pointAwards.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-base font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <Star className="h-5 w-5 text-amber-500" />
              Puntos Otorgados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pointAwards.map((award) => (
              <div key={award.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <Star className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", settings.dyslexiaMode && "tracking-wide")}>
                    {award.teacher_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {award.teacher_email && `${award.teacher_email} · `}{award.subject_name}
                  </p>
                  {award.reason && (
                    <p className="text-xs text-muted-foreground">{award.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(award.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <span className="text-lg font-bold text-amber-600">+{award.points}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attendance Overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-base font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <Calendar className="h-5 w-5" />
              Asistencia
            </CardTitle>
            <span className={cn("text-lg font-bold", attendanceRate >= 95 ? "text-green-600" : attendanceRate >= 90 ? "text-amber-600" : "text-red-500")}>
              {attendanceRate}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-green-50">
              <p className="text-xl font-bold text-green-700">{attendanceData.present}</p>
              <p className={cn("text-xs text-green-600", settings.dyslexiaMode && "tracking-wide")}>Presente</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <p className="text-xl font-bold text-red-600">{attendanceData.absent}</p>
              <p className={cn("text-xs text-red-500", settings.dyslexiaMode && "tracking-wide")}>Ausente</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50">
              <p className="text-xl font-bold text-amber-600">{attendanceData.late}</p>
              <p className={cn("text-xs text-amber-500", settings.dyslexiaMode && "tracking-wide")}>Tardanza</p>
            </div>
          </div>

          {showWarning && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className={cn("text-sm font-medium text-amber-800", settings.dyslexiaMode && "tracking-wide")}>
                  {"Mejoremos la asistencia juntos"}
                </p>
                <p className={cn("text-xs text-amber-700 mt-1", settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
                  Tu asistencia está por debajo del 90%. Asistir regularmente te ayuda a mantenerte al día con tus estudios.
                  Hablá con un docente si necesitás apoyo.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-base font-semibold", settings.dyslexiaMode && "tracking-wide")}>
            Últimos días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {recentAttendance.map((day) => {
              const Icon = statusIcons[day.status]
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", statusColors[day.status])}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className={cn("text-xs text-muted-foreground", settings.dyslexiaMode && "tracking-wide")}>
                    {day.date.split(" ")[1]}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Presente</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /><span>Tardanza</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400" /><span>Ausente</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className={cn("text-sm text-foreground text-center", settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
            Esta información está sincronizada con tu institución.
            Si notás algún error, hablá con tu docente o la secretaría de la escuela.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
