"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

type EventType = "exam" | "homework" | "event" | "reminder"

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  event_type: EventType
  user_id: string
  isTeacherEvent?: boolean
}

const eventTypeColors: Record<EventType, string> = {
  exam: "bg-red-500",
  homework: "bg-blue-500",
  event: "bg-green-500",
  reminder: "bg-amber-500",
}

const eventTypeLabels: Record<EventType, string> = {
  exam: "Examen",
  homework: "Tarea",
  event: "Evento",
  reminder: "Recordatorio",
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function CalendarView() {
  const { settings } = useAccessibility()
  const { user } = useSupabaseAuth()
  const supabase = getSupabaseClient()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "event" as EventType,
  })

  const loadEvents = useCallback(async () => {
    if (!user || !supabase) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from("calendar_events")
        .select("id, title, description, event_date, event_type, user_id")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true })
      setEvents((data as CalendarEvent[]) ?? [])

      // Load teacher tasks for spaces the student belongs to
      const { data: memberships } = await supabase
        .from("space_memberships")
        .select("space_id")
        .eq("student_id", user.id)

      if (memberships?.length) {
        const spaceIds = memberships.map((m) => m.space_id)

        const { data: teacherTasks } = await supabase
          .from("teacher_tasks")
          .select("id, title, due_date, space_id")
          .in("space_id", spaceIds)
          .eq("assigned_to_all", true)

        if (teacherTasks?.length) {
          const teacherEvents: CalendarEvent[] = teacherTasks.map((t) => ({
            id: `teacher-${t.id}`,
            title: t.title,
            description: null,
            event_date: t.due_date,
            event_type: "homework" as EventType,
            user_id: user.id,
            isTeacherEvent: true,
          }))
          setEvents((prev) => [...prev, ...teacherEvents])
        }
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startingDay = new Date(year, month, 1).getDay()
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate)

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => e.event_date === dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null

  const selectedDateEvents = selectedDateStr
    ? events.filter((e) => e.event_date === selectedDateStr)
    : []

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDateStr) return
    setIsSaving(true)
    setSaveError(null)
    try {
      let savedToDb = false
      if (user && supabase) {
        const { data, error } = await supabase
          .from("calendar_events")
          .insert({
            user_id: user.id,
            title: newEvent.title.trim(),
            description: newEvent.description.trim() || null,
            event_date: selectedDateStr,
            event_type: newEvent.event_type,
            is_personal: true,
          })
          .select("id, title, description, event_date, event_type, user_id")
          .single()

        if (!error && data) {
          setEvents((prev) => [...prev, data as CalendarEvent])
          savedToDb = true
        }
        // Log DB error but continue to save locally anyway
        if (error) console.warn("Calendar DB error (saving locally):", error.message)
      }

      if (!savedToDb) {
        const localEvent: CalendarEvent = {
          id: `local-${Date.now()}`,
          title: newEvent.title.trim(),
          description: newEvent.description.trim() || null,
          event_date: selectedDateStr,
          event_type: newEvent.event_type,
          user_id: user?.id ?? "local",
        }
        setEvents((prev) => [...prev, localEvent])
      }
      setNewEvent({ title: "", description: "", event_type: "event" })
      setShowAddModal(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar el evento.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!supabase) return
    await supabase.from("calendar_events").delete().eq("id", eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const openAddModal = () => {
    setNewEvent({ title: "", description: "", event_type: "event" })
    setSaveError(null)
    setShowAddModal(true)
  }

  return (
    <div className={cn("space-y-4", settings.increasedSpacing && "space-y-6")}>
      {/* Calendar Header */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className={cn("text-lg font-semibold", settings.dyslexiaMode && "tracking-wide")}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className={cn(
                  "text-center text-xs font-medium text-muted-foreground py-2",
                  settings.dyslexiaMode && "tracking-wide"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDate(day)
                const today = isToday(day)
                const isSelected =
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentDate.getMonth() &&
                  selectedDate?.getFullYear() === currentDate.getFullYear()

                return (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
                    }
                    className={cn(
                      "aspect-square p-1 rounded-lg flex flex-col items-center justify-start",
                      "text-sm font-medium transition-colors",
                      settings.reducedAnimations && "transition-none",
                      today && "bg-primary text-primary-foreground",
                      isSelected && !today && "bg-primary/20 ring-2 ring-primary",
                      !today && !isSelected && "hover:bg-muted"
                    )}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn("w-1.5 h-1.5 rounded-full", eventTypeColors[event.event_type])}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-base font-semibold", settings.dyslexiaMode && "tracking-wide")}>
                {selectedDate.toLocaleDateString("es-AR", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-6">
                <p className={cn("text-sm text-muted-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  No hay eventos para este día
                </p>
                <Button size="sm" variant="ghost" className="mt-3 gap-1" onClick={openAddModal}>
                  <Plus className="h-4 w-4" />
                  Agregar evento
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg bg-muted/30",
                      settings.increasedSpacing && "p-4"
                    )}
                  >
                    <div className={cn("w-2 h-8 rounded-full shrink-0", eventTypeColors[event.event_type])} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", settings.dyslexiaMode && "tracking-wide")}>
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{eventTypeLabels[event.event_type]}</p>
                      {event.isTeacherEvent && (
                        <p className="text-xs text-primary font-medium">Del docente</p>
                      )}
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      )}
                    </div>
                    {!event.isTeacherEvent && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Eliminar evento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {(Object.keys(eventTypeColors) as EventType[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", eventTypeColors[type])} />
                <span className="text-xs text-muted-foreground">{eventTypeLabels[type]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar evento</DialogTitle>
          </DialogHeader>

          {selectedDate && (
            <p className="text-sm text-muted-foreground">
              {selectedDate.toLocaleDateString("es-AR", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Título</Label>
              <Input
                id="event-title"
                placeholder="Ej: Examen de Matemáticas"
                value={newEvent.title}
                onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-type">Tipo</Label>
              <Select
                value={newEvent.event_type}
                onValueChange={(v) => setNewEvent((p) => ({ ...p, event_type: v as EventType }))}
              >
                <SelectTrigger id="event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(eventTypeLabels) as EventType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {eventTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-desc">Descripción (opcional)</Label>
              <Textarea
                id="event-desc"
                placeholder="Detalles del evento..."
                rows={3}
                value={newEvent.description}
                onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowAddModal(false); setSaveError(null) }} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddEvent}
              disabled={!newEvent.title.trim() || isSaving}
              className="gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
