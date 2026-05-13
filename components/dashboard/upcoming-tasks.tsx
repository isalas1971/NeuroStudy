"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Clock, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { TextToSpeech } from "@/components/accessibility/text-to-speech"
import { TextHighlighter } from "@/components/accessibility/text-highlighter"

interface Task {
  id: string
  title: string
  subject: string
  dueDate: string
  completed: boolean
  priority: "low" | "medium" | "high"
  isTeacherTask?: boolean
  teacherName?: string
  teacherEmail?: string
}

const initialPersonalTasks: Task[] = [
  { id: "1", title: "Tarea de Matemáticas - Capítulo 5", subject: "Matemáticas", dueDate: "Hoy", completed: false, priority: "high" },
  { id: "2", title: "Leer páginas 45-60", subject: "Literatura", dueDate: "Mañana", completed: false, priority: "medium" },
  { id: "3", title: "Informe de laboratorio de Ciencias", subject: "Ciencias", dueDate: "Viernes", completed: true, priority: "low" },
]

const priorityColors = {
  low: "bg-muted",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
}

function formatDueDate(dateStr: string): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const taskDate = new Date(dateStr + "T00:00:00")

  if (taskDate.toDateString() === today.toDateString()) return "Hoy"
  if (taskDate.toDateString() === tomorrow.toDateString()) return "Mañana"
  return taskDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

export function UpcomingTasks() {
  const { settings, addPoints } = useAccessibility()
  const { user } = useSupabaseAuth()
  const supabase = getSupabaseClient()

  const [tasks, setTasks] = useState<Task[]>(initialPersonalTasks)
  const [isLoadingTeacherTasks, setIsLoadingTeacherTasks] = useState(true)

  const loadTeacherTasks = useCallback(async () => {
    if (!user || !supabase) { setIsLoadingTeacherTasks(false); return }

    // Get spaces the student is in
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("space_id")
      .eq("student_id", user.id)

    if (!memberships?.length) { setIsLoadingTeacherTasks(false); return }

    const spaceIds = memberships.map((m) => m.space_id)

    // Get space info + teacher profile
    const { data: spaces } = await supabase
      .from("teacher_spaces")
      .select("id, subject_name, teacher_id")
      .in("id", spaceIds)

    const spaceMap = Object.fromEntries((spaces ?? []).map((s) => [s.id, s.subject_name]))

    const teacherIds = [...new Set((spaces ?? []).map((s) => s.teacher_id))]
    const { data: teacherProfiles } = await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", teacherIds)
    const teacherProfileMap = Object.fromEntries((teacherProfiles ?? []).map((p) => [p.id, { name: p.name ?? "Docente", email: p.email ?? "" }]))
    const spaceTeacherMap = Object.fromEntries((spaces ?? []).map((s) => [s.id, teacherProfileMap[s.teacher_id] ?? { name: "Docente", email: "" }]))

    const today = new Date().toISOString().split("T")[0]

    // Tasks assigned to all students in those spaces
    const { data: allTasks } = await supabase
      .from("teacher_tasks")
      .select("id, title, description, due_date, space_id, assigned_to_all")
      .in("space_id", spaceIds)
      .eq("assigned_to_all", true)
      .gte("due_date", today)
      .order("due_date", { ascending: true })

    // Tasks assigned individually to this student
    const { data: individualAssignments } = await supabase
      .from("task_assignments")
      .select("task_id, completed, teacher_tasks(id, title, description, due_date, space_id, assigned_to_all)")
      .eq("student_id", user.id)
      .eq("completed", false)

    const individualTaskIds = new Set((individualAssignments ?? []).map((a) => (a.teacher_tasks as unknown as { id: string } | null)?.id))

    // Merge and deduplicate
    const teacherTasks: Task[] = []

    for (const t of (allTasks ?? [])) {
      if (individualTaskIds.has(t.id)) continue // will be added from individual assignments
      teacherTasks.push({
        id: `tt-${t.id}`,
        title: t.title,
        subject: spaceMap[t.space_id] ?? "Docente",
        dueDate: formatDueDate(t.due_date),
        completed: false,
        priority: "medium",
        isTeacherTask: true,
        teacherName: spaceTeacherMap[t.space_id]?.name,
        teacherEmail: spaceTeacherMap[t.space_id]?.email,
      })
    }

    for (const a of (individualAssignments ?? [])) {
      const t = a.teacher_tasks as unknown as { id: string; title: string; due_date: string; space_id: string } | null
      if (!t) continue
      teacherTasks.push({
        id: `tt-${t.id}`,
        title: t.title,
        subject: spaceMap[t.space_id] ?? "Docente",
        dueDate: formatDueDate(t.due_date),
        completed: a.completed,
        priority: "medium",
        isTeacherTask: true,
        teacherName: spaceTeacherMap[t.space_id]?.name,
        teacherEmail: spaceTeacherMap[t.space_id]?.email,
      })
    }

    setTasks((prev) => {
      // Keep personal tasks, replace any previous teacher tasks
      const personal = prev.filter((t) => !t.isTeacherTask)
      return [...personal, ...teacherTasks]
    })
    setIsLoadingTeacherTasks(false)
  }, [user, supabase])

  useEffect(() => { loadTeacherTasks() }, [loadTeacherTasks])

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        if (!task.completed) addPoints(5)
        return { ...task, completed: !task.completed }
      })
    )
  }

  const allTasksText = tasks
    .map((task) => `${task.title}, vence ${task.dueDate}, ${task.completed ? "completada" : "pendiente"}`)
    .join(". ")

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-base font-semibold", settings.dyslexiaMode && "tracking-wide")}>
            Tareas Próximas
          </CardTitle>
          {(settings.textToSpeech || settings.dyslexiaMode) && (
            <TextToSpeech text={`Tenés ${tasks.length} tareas. ${allTasksText}`} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <TextHighlighter>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg bg-muted/30 group",
                task.completed && "opacity-60"
              )}
            >
              <button
                className={cn("mt-0.5 shrink-0", !settings.reducedAnimations && "transition-colors")}
                onClick={() => handleToggleTask(task.id)}
                aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium text-sm text-foreground flex-1",
                    task.completed && "line-through",
                    settings.dyslexiaMode && "tracking-wide leading-relaxed"
                  )}>
                    {task.title}
                  </p>
                  {(settings.textToSpeech || settings.dyslexiaMode) && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <TextToSpeech text={`${task.title}, ${task.subject}, vence ${task.dueDate}`} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full flex items-center gap-1", priorityColors[task.priority])}>
                    {task.isTeacherTask && <GraduationCap className="h-2.5 w-2.5" />}
                    {task.subject}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.dueDate}
                  </span>
                </div>
                {task.isTeacherTask && task.teacherName && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {task.teacherName}{task.teacherEmail ? ` · ${task.teacherEmail}` : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </TextHighlighter>

        {isLoadingTeacherTasks && (
          <p className="text-xs text-muted-foreground text-center">Cargando tareas del docente...</p>
        )}
      </CardContent>
    </Card>
  )
}
