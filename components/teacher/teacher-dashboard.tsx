"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  GraduationCap, Plus, ChevronLeft, Copy, Check, Users, ClipboardList,
  MessageSquare, Star, Loader2, LogOut, School, Trash2, Send,
} from "lucide-react"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { NeuroStudyLogo } from "@/components/ui/neurostudy-logo"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeacherSpace {
  id: string
  school_name: string
  subject_name: string
  space_code: string
  created_at: string
  student_count?: number
}

interface SpaceStudent {
  membership_id: string
  student_id: string
  name: string
  joined_at: string
}

interface TeacherTask {
  id: string
  title: string
  description: string | null
  due_date: string
  assigned_to_all: boolean
}

interface TeacherMessage {
  id: string
  content: string
  recipient_all: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function groupBySchool(spaces: TeacherSpace[]): Record<string, TeacherSpace[]> {
  return spaces.reduce<Record<string, TeacherSpace[]>>((acc, space) => {
    if (!acc[space.school_name]) acc[space.school_name] = []
    acc[space.school_name].push(space)
    return acc
  }, {})
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StudentsTab({ students, isLoading }: { students: SpaceStudent[]; isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  if (students.length === 0) {
    return (
      <div className="text-center py-10">
        <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Ningún alumno se unió aún</p>
        <p className="text-xs text-muted-foreground mt-1">Compartí el código de espacio con tus alumnos</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">{students.length} alumno{students.length !== 1 ? "s" : ""} en este espacio</p>
      {students.map((s) => (
        <div key={s.membership_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
            {s.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{s.name}</p>
            <p className="text-xs text-muted-foreground">
              Se unió el {new Date(s.joined_at).toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TasksTab({ spaceId, supabase, teacherId, students }: {
  spaceId: string
  supabase: ReturnType<typeof getSupabaseClient>
  teacherId: string
  students: SpaceStudent[]
}) {
  const [tasks, setTasks] = useState<TeacherTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", due_date: "", assigned_to_all: true, student_ids: [] as string[] })

  const load = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return }
    const { data } = await supabase
      .from("teacher_tasks")
      .select("id, title, description, due_date, assigned_to_all")
      .eq("space_id", spaceId)
      .order("due_date", { ascending: true })
    setTasks((data as TeacherTask[]) ?? [])
    setIsLoading(false)
  }, [spaceId, supabase])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!supabase || !form.title.trim() || !form.due_date) return
    setIsSaving(true)
    const { data, error } = await supabase
      .from("teacher_tasks")
      .insert({ space_id: spaceId, teacher_id: teacherId, title: form.title.trim(), description: form.description.trim() || null, due_date: form.due_date, assigned_to_all: form.assigned_to_all })
      .select("id, title, description, due_date, assigned_to_all")
      .single()

    if (!error && data) {
      if (!form.assigned_to_all && form.student_ids.length > 0) {
        await supabase.from("task_assignments").insert(
          form.student_ids.map((sid) => ({ task_id: data.id, student_id: sid, completed: false }))
        )
      }
      setTasks((prev) => [...prev, data as TeacherTask].sort((a, b) => a.due_date.localeCompare(b.due_date)))
    }
    setForm({ title: "", description: "", due_date: "", assigned_to_all: true, student_ids: [] })
    setShowModal(false)
    setIsSaving(false)
  }

  const handleDelete = async (taskId: string) => {
    if (!supabase) return
    await supabase.from("teacher_tasks").delete().eq("id", taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{tasks.length} tarea{tasks.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Nueva tarea
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay tareas asignadas aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Vence: {new Date(t.due_date + "T00:00:00").toLocaleDateString("es-AR")}
                  </span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full", t.assigned_to_all ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700")}>
                    {t.assigned_to_all ? "Todos" : "Seleccionados"}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Ej: Leer capítulo 3" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Textarea rows={2} placeholder="Detalles..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de entrega</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="all-students" className="font-normal">Asignar a todos los alumnos</Label>
              <Switch id="all-students" checked={form.assigned_to_all} onCheckedChange={(v) => setForm((p) => ({ ...p, assigned_to_all: v, student_ids: [] }))} />
            </div>
            {!form.assigned_to_all && students.length > 0 && (
              <div className="space-y-2">
                <Label>Seleccionar alumnos</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {students.map((s) => (
                    <label key={s.student_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.student_ids.includes(s.student_id)}
                        onChange={(e) => setForm((p) => ({
                          ...p,
                          student_ids: e.target.checked ? [...p.student_ids, s.student_id] : p.student_ids.filter((id) => id !== s.student_id)
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.due_date || isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MessagesTab({ spaceId, supabase, teacherId, students }: {
  spaceId: string
  supabase: ReturnType<typeof getSupabaseClient>
  teacherId: string
  students: SpaceStudent[]
}) {
  const [messages, setMessages] = useState<TeacherMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ content: "", recipient_all: true, student_ids: [] as string[] })

  const load = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return }
    const { data } = await supabase
      .from("teacher_messages")
      .select("id, content, recipient_all, created_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })
    setMessages((data as TeacherMessage[]) ?? [])
    setIsLoading(false)
  }, [spaceId, supabase])

  useEffect(() => { load() }, [load])

  const handleSend = async () => {
    if (!supabase || !form.content.trim()) return
    setIsSaving(true)
    const { data, error } = await supabase
      .from("teacher_messages")
      .insert({ space_id: spaceId, teacher_id: teacherId, content: form.content.trim(), recipient_all: form.recipient_all })
      .select("id, content, recipient_all, created_at")
      .single()

    if (!error && data) {
      if (!form.recipient_all && form.student_ids.length > 0) {
        await supabase.from("message_recipients").insert(
          form.student_ids.map((sid) => ({ message_id: data.id, student_id: sid }))
        )
      }
      setMessages((prev) => [data as TeacherMessage, ...prev])
    }
    setForm({ content: "", recipient_all: true, student_ids: [] })
    setShowModal(false)
    setIsSaving(false)
  }

  const handleDelete = async (msgId: string) => {
    if (!supabase) return
    await supabase.from("teacher_messages").delete().eq("id", msgId)
    setMessages((prev) => prev.filter((m) => m.id !== msgId))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{messages.length} mensaje{messages.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowModal(true)}>
          <Send className="h-4 w-4" /> Nuevo mensaje
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay mensajes enviados aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm">{m.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full", m.recipient_all ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700")}>
                    {m.recipient_all ? "Todos" : "Seleccionados"}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo mensaje</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mensaje</Label>
              <Textarea rows={4} placeholder="Escribí tu mensaje..." value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="msg-all" className="font-normal">Enviar a todos los alumnos</Label>
              <Switch id="msg-all" checked={form.recipient_all} onCheckedChange={(v) => setForm((p) => ({ ...p, recipient_all: v, student_ids: [] }))} />
            </div>
            {!form.recipient_all && students.length > 0 && (
              <div className="space-y-2">
                <Label>Seleccionar destinatarios</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {students.map((s) => (
                    <label key={s.student_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.student_ids.includes(s.student_id)}
                        onChange={(e) => setForm((p) => ({
                          ...p,
                          student_ids: e.target.checked ? [...p.student_ids, s.student_id] : p.student_ids.filter((id) => id !== s.student_id)
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSend} disabled={!form.content.trim() || isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PointsTab({ spaceId, supabase, teacherId, students }: {
  spaceId: string
  supabase: ReturnType<typeof getSupabaseClient>
  teacherId: string
  students: SpaceStudent[]
}) {
  const [awards, setAwards] = useState<Array<{ id: string; student_id: string; student_name?: string; points: number; reason: string | null; created_at: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ student_id: "", points: "10", reason: "" })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return }
    const { data } = await supabase
      .from("teacher_point_awards")
      .select("id, student_id, points, reason, created_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })
      .limit(20)
    const studentMap = Object.fromEntries(students.map((s) => [s.student_id, s.name]))
    setAwards((data ?? []).map((a: { id: string; student_id: string; points: number; reason: string | null; created_at: string }) => ({ ...a, student_name: studentMap[a.student_id] ?? "Alumno" })))
    setIsLoading(false)
  }, [spaceId, supabase, students])

  useEffect(() => { if (students.length >= 0) load() }, [load, students])

  const handleAward = async () => {
    if (!supabase || !form.student_id) return
    const pts = parseInt(form.points)
    if (isNaN(pts) || pts <= 0) { setError("Ingresá una cantidad válida de puntos"); return }
    setIsSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from("teacher_point_awards")
      .insert({ space_id: spaceId, teacher_id: teacherId, student_id: form.student_id, points: pts, reason: form.reason.trim() || null })
      .select("id, student_id, points, reason, created_at")
      .single()

    if (insertError) { setError("Error al otorgar puntos"); setIsSaving(false); return }

    if (data) {
      const studentName = students.find((s) => s.student_id === form.student_id)?.name ?? "Alumno"
      setAwards((prev) => [{ ...data, student_name: studentName }, ...prev])
    }
    setForm({ student_id: "", points: "10", reason: "" })
    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Award form */}
      <Card className="border-border/50">
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium">Otorgar puntos</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Alumno</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar alumno..." /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.student_id} value={s.student_id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Puntos</Label>
              <Input type="number" min={1} max={1000} value={form.points} onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Input placeholder="Ej: Participación" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {students.length === 0 && (
            <p className="text-xs text-muted-foreground">No hay alumnos en el espacio aún.</p>
          )}
          <Button className="w-full gap-2" onClick={handleAward} disabled={!form.student_id || isSaving || students.length === 0}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Star className="h-4 w-4" />
            Otorgar puntos
          </Button>
        </CardContent>
      </Card>

      {/* Awards history */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : awards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Historial</p>
          {awards.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                <Star className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.student_name}</p>
                {a.reason && <p className="text-xs text-muted-foreground">{a.reason}</p>}
              </div>
              <span className="text-sm font-bold text-amber-600">+{a.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Space Detail ─────────────────────────────────────────────────────────────

function SpaceDetail({ space, onBack, supabase, teacherId }: {
  space: TeacherSpace
  onBack: () => void
  supabase: ReturnType<typeof getSupabaseClient>
  teacherId: string
}) {
  const [copied, setCopied] = useState(false)
  const [students, setStudents] = useState<SpaceStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)

  const copyCode = () => {
    navigator.clipboard.writeText(space.space_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadStudents = useCallback(async () => {
    if (!supabase) { setStudentsLoading(false); return }
    setStudentsLoading(true)
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("id, student_id, joined_at")
      .eq("space_id", space.id)
    if (!memberships?.length) { setStudents([]); setStudentsLoading(false); return }
    const ids = memberships.map((m) => m.student_id)

    // Use server-side API to resolve names (falls back to email prefix)
    const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) })
    const { students: resolved } = res.ok ? await res.json() : { students: [] as { id: string; name: string }[] }
    const nameMap = Object.fromEntries((resolved as { id: string; name: string }[]).map((s) => [s.id, s.name]))

    setStudents(memberships.map((m) => ({
      membership_id: m.id,
      student_id: m.student_id,
      name: nameMap[m.student_id] ?? "Alumno",
      joined_at: m.joined_at,
    })))
    setStudentsLoading(false)
  }, [supabase, space.id])

  useEffect(() => { loadStudents() }, [loadStudents])

  return (
    <div className="space-y-4">
      {/* Space header */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{space.subject_name}</p>
              <p className="text-sm text-muted-foreground">{space.school_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-1">Código de espacio</p>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <span className="font-mono font-bold text-primary tracking-widest text-lg">{space.space_code}</span>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-primary" />}
              </button>
              {copied && <p className="text-xs text-green-600 mt-1">¡Copiado!</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students"><Users className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="tasks"><ClipboardList className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="h-4 w-4" /></TabsTrigger>
          <TabsTrigger value="points"><Star className="h-4 w-4" /></TabsTrigger>
        </TabsList>
        <div className="mt-1 mb-2 flex justify-around text-[11px] text-muted-foreground">
          <span>Alumnos</span>
          <span>Tareas</span>
          <span>Mensajes</span>
          <span>Puntos</span>
        </div>

        <TabsContent value="students">
          <StudentsTab students={students} isLoading={studentsLoading} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab spaceId={space.id} supabase={supabase} teacherId={teacherId} students={students} />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab spaceId={space.id} supabase={supabase} teacherId={teacherId} students={students} />
        </TabsContent>
        <TabsContent value="points">
          <PointsTab spaceId={space.id} supabase={supabase} teacherId={teacherId} students={students} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const router = useRouter()
  const { user, signOut } = useSupabaseAuth()
  const supabase = getSupabaseClient()

  const [spaces, setSpaces] = useState<TeacherSpace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSpace, setSelectedSpace] = useState<TeacherSpace | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSavingSpace, setIsSavingSpace] = useState(false)
  const [createForm, setCreateForm] = useState({ school_name: "", subject_name: "" })
  const [createError, setCreateError] = useState<string | null>(null)
  const [prefillSchool, setPrefillSchool] = useState("")

  const loadSpaces = useCallback(async () => {
    if (!user || !supabase) { setIsLoading(false); return }
    const { data } = await supabase
      .from("teacher_spaces")
      .select("id, school_name, subject_name, space_code, created_at")
      .eq("teacher_id", user.id)
      .order("school_name", { ascending: true })

    if (data) {
      const spacesWithCount = await Promise.all((data as TeacherSpace[]).map(async (space) => {
        const { count } = await supabase.from("space_memberships").select("*", { count: "exact", head: true }).eq("space_id", space.id)
        return { ...space, student_count: count ?? 0 }
      }))
      setSpaces(spacesWithCount)
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => { loadSpaces() }, [loadSpaces])

  const openCreateForSchool = (schoolName: string) => {
    setCreateForm({ school_name: schoolName, subject_name: "" })
    setPrefillSchool(schoolName)
    setShowCreateModal(true)
  }

  const openCreateNew = () => {
    setCreateForm({ school_name: "", subject_name: "" })
    setPrefillSchool("")
    setShowCreateModal(true)
  }

  const handleCreateSpace = async () => {
    if (!user || !supabase || !createForm.school_name.trim() || !createForm.subject_name.trim()) return
    setIsSavingSpace(true)
    setCreateError(null)

    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data, error } = await supabase
        .from("teacher_spaces")
        .insert({ teacher_id: user.id, school_name: createForm.school_name.trim(), subject_name: createForm.subject_name.trim(), space_code: code })
        .select("id, school_name, subject_name, space_code, created_at")
        .single()

      if (!error && data) {
        setSpaces((prev) => [...prev, { ...(data as TeacherSpace), student_count: 0 }])
        setCreateForm({ school_name: "", subject_name: "" })
        setShowCreateModal(false)
        break
      }
      if (error?.code === "23505") {
        code = generateCode()
        attempts++
      } else {
        setCreateError("Error al crear el espacio. Intentá nuevamente.")
        break
      }
    }
    setIsSavingSpace(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/teacher/login")
  }

  const grouped = groupBySchool(spaces)

  const rawTeacherName = user?.name
  const teacherDisplayName = (rawTeacherName && !rawTeacherName.includes("@"))
    ? rawTeacherName
    : user?.email?.split("@")[0] ?? "Docente"
  const nameParts = teacherDisplayName.split(" ")
  const teacherFirstName = nameParts[0].endsWith(".") && nameParts.length > 1
    ? nameParts.slice(1).join(" ")
    : nameParts[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-2xl mx-auto gap-3">
          {selectedSpace ? (
            <button onClick={() => setSelectedSpace(null)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <NeuroStudyLogo size={32} />
          )}
          <div className="flex-1 min-w-0">
            {selectedSpace ? (
              <>
                <p className="font-semibold text-sm truncate">{selectedSpace.subject_name}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedSpace.school_name}</p>
              </>
            ) : (
              <>
                <span className="font-semibold text-sm" style={{ color: "#1B3A5C" }}>
                  Neuro<span style={{ color: "#4191A8" }}>Study</span>
                </span>
                <p className="text-xs text-muted-foreground truncate">{teacherDisplayName}</p>
              </>
            )}
          </div>
          {!selectedSpace && (
            <button onClick={handleSignOut} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-8">
        {selectedSpace ? (
          <SpaceDetail
            space={selectedSpace}
            onBack={() => setSelectedSpace(null)}
            supabase={supabase}
            teacherId={user?.id ?? ""}
          />
        ) : (
          <div className="space-y-6">
            {/* Welcome greeting */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">¡Hola, {teacherFirstName}!</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Bienvenido/a a tu portal docente</p>
              </div>
              <Button size="sm" className="gap-1 shrink-0" onClick={openCreateNew}>
                <Plus className="h-4 w-4" /> Nueva Escuela
              </Button>
            </div>

            {/* Space list */}
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : spaces.length === 0 ? (
              <Card className="border-dashed border-2 border-border/60">
                <CardContent className="py-12 text-center">
                  <School className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="font-medium text-foreground mb-1">Todavía no tenés espacios</p>
                  <p className="text-sm text-muted-foreground mb-4">Creá tu primer espacio para comenzar a gestionar tus alumnos</p>
                  <Button onClick={() => setShowCreateModal(true)} className="gap-1">
                    <Plus className="h-4 w-4" /> Crear primer espacio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(grouped).map(([school, schoolSpaces]) => (
                <div key={school}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{school}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => openCreateForSchool(school)}
                    >
                      <Plus className="h-3 w-3" />
                      Nueva Materia
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {schoolSpaces.map((space) => (
                      <Card
                        key={space.id}
                        className="border-border/50 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedSpace(space)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{space.subject_name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                {space.student_count ?? 0} alumnos
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Código</p>
                            <span className="font-mono font-bold text-primary tracking-widest">{space.space_code}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Create Space Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) setPrefillSchool("") }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nueva Materia</DialogTitle></DialogHeader>
          <CardDescription>Se generará automáticamente un código único para compartir con tus alumnos.</CardDescription>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Escuela</Label>
              <Input
                placeholder="Ej: Colegio Santa María"
                value={createForm.school_name}
                onChange={(e) => !prefillSchool && setCreateForm((p) => ({ ...p, school_name: e.target.value }))}
                readOnly={!!prefillSchool}
                className={prefillSchool ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Materia</Label>
              <Input placeholder="Ej: Matemática" value={createForm.subject_name} onChange={(e) => setCreateForm((p) => ({ ...p, subject_name: e.target.value }))} />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); setPrefillSchool("") }} disabled={isSavingSpace}>Cancelar</Button>
            <Button onClick={handleCreateSpace} disabled={!createForm.school_name.trim() || !createForm.subject_name.trim() || isSavingSpace} className="gap-2">
              {isSavingSpace && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
