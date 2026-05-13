"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAccessibility, type AccessibilityProfile, type ColorTheme, type DyslexiaFont } from "@/contexts/accessibility-context"
import {
  Brain, BookOpen, Sparkles, RotateCcw, Volume2, Eye, Timer, User, ChevronRight,
  Palette, Sun, Moon, Type, ListTodo, Coffee, Focus, Check
} from "lucide-react"

const profiles = [
  {
    id: "adhd" as const,
    title: "Modo TDAH",
    description: "Sesiones cortas, micro-tareas, descansos guiados",
    icon: Sparkles,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
  {
    id: "dyslexia" as const,
    title: "Modo Dislexia",
    description: "Fuente OpenDyslexic, texto a voz, resaltado",
    icon: BookOpen,
    color: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-600",
  },
  {
    id: "autism" as const,
    title: "Modo TEA",
    description: "Diseño limpio, animaciones reducidas, modo foco",
    icon: Brain,
    color: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
  },
]

const colorThemes: { id: ColorTheme; name: string; colors: string[]; icon: React.ElementType }[] = [
  { id: "default", name: "Por defecto", colors: ["#4a90a4", "#7cb69d", "#f8fafc"], icon: Palette },
  { id: "light", name: "Cálido claro", colors: ["#A7BBC7", "#BFD8B8", "#F4F1DE"], icon: Sun },
  { id: "dark", name: "Oscuro suave", colors: ["#52796F", "#354F52", "#2F3E46"], icon: Moon },
]

const sessionDurations = [15, 20, 25, 30, 45]
const breakDurations = [5, 10, 15]

const dyslexiaFontOptions: { id: DyslexiaFont; name: string; style: React.CSSProperties }[] = [
  { id: "opendyslexic", name: "OpenDyslexic", style: { fontFamily: "'OpenDyslexic', sans-serif" } },
  { id: "lexend", name: "Lexend", style: { fontFamily: "'Lexend', sans-serif" } },
  { id: "arial", name: "Arial", style: { fontFamily: "Arial, sans-serif" } },
  { id: "helvetica", name: "Helvetica", style: { fontFamily: "Helvetica, Arial, sans-serif" } },
]

const REFERENCE_TEXT = "El rápido zorro marrón salta sobre el perro perezoso."

export function SettingsView() {
  const {
    settings,
    updateProfile,
    toggleMode,
    updateSetting,
    resetOnboarding,
  } = useAccessibility()

  return (
    <div className={cn("space-y-6", settings.increasedSpacing && "space-y-8")}>
      {/* Mi Perfil */}
      <Link href="/profile">
        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                    Mi Perfil
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Editá tu nombre, foto y cuenta
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Tema de colores */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
            <Palette className="h-5 w-5" />
            Tema de colores
          </CardTitle>
          <CardDescription className={cn(settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
            Elegí la paleta que mejor te funcione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {colorThemes.map((theme) => {
              const Icon = theme.icon
              const isActive = settings.colorTheme === theme.id
              return (
                <button
                  key={theme.id}
                  onClick={() => updateSetting("colorTheme", theme.id)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                    isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex gap-1 mb-2">
                    {theme.colors.map((color, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <Icon className={cn("h-4 w-4 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                    {theme.name}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Perfiles de accesibilidad */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold", settings.dyslexiaMode && "tracking-wide")}>
            Perfiles de accesibilidad
          </CardTitle>
          <CardDescription className={cn(settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
            Podés combinar varios perfiles a la vez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.map((profile) => {
            const Icon = profile.icon
            const modeKey = `${profile.id}Mode` as keyof typeof settings
            const isActive = settings[modeKey] as boolean
            return (
              <div
                key={profile.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2",
                  profile.color,
                  isActive && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-white", profile.iconColor)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                      {profile.title}
                    </h3>
                    <p className={cn("text-xs text-muted-foreground", settings.dyslexiaMode && "tracking-wide")}>
                      {profile.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleMode(profile.id)}
                  aria-label={`Activar ${profile.title}`}
                />
              </div>
            )
          })}

          {/* Sin preferencia — desactiva todos los modos */}
          {(() => {
            const noneActive = !settings.adhdMode && !settings.dyslexiaMode && !settings.autismMode
            return (
              <button
                onClick={() => updateProfile("none")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                  "bg-muted/50 border-muted hover:border-muted-foreground/20",
                  noneActive && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <span className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  Sin preferencia — configuración por defecto
                </span>
                {noneActive && <Check className="h-5 w-5 text-primary shrink-0" />}
              </button>
            )
          })()}
        </CardContent>
      </Card>

      {/* Sesiones de estudio */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
            <Timer className="h-5 w-5" />
            Sesiones de estudio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={cn("block text-sm font-medium text-foreground mb-2", settings.dyslexiaMode && "tracking-wide")}>
              Duración de la sesión
            </label>
            <div className="flex flex-wrap gap-2">
              {sessionDurations.map((duration) => (
                <Button
                  key={duration}
                  variant={settings.studySessionDuration === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("studySessionDuration", duration)}
                  className="min-w-[60px]"
                >
                  {duration}m
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className={cn("block text-sm font-medium text-foreground mb-2", settings.dyslexiaMode && "tracking-wide")}>
              Duración del descanso
            </label>
            <div className="flex gap-2">
              {breakDurations.map((duration) => (
                <Button
                  key={duration}
                  variant={settings.breakDuration === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("breakDuration", duration)}
                  className="min-w-[60px]"
                >
                  {duration}m
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className={cn("block text-sm font-medium text-foreground mb-2", settings.dyslexiaMode && "tracking-wide")}>
              Frecuencia de recordatorios
            </label>
            <div className="flex gap-2">
              {([["low", "Baja"], ["medium", "Media"], ["high", "Alta"]] as const).map(([freq, label]) => (
                <Button
                  key={freq}
                  variant={settings.reminderFrequency === freq ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("reminderFrequency", freq)}
                  className="flex-1"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funciones TDAH */}
      {settings.adhdMode && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <Sparkles className="h-5 w-5 text-amber-500" />
              Funciones TDAH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  <ListTodo className="h-4 w-4 inline mr-2" />
                  Micro-Tareas
                </p>
                <p className="text-xs text-muted-foreground">Dividí las tareas en pasos pequeños</p>
              </div>
              <Switch
                checked={settings.microTasksEnabled}
                onCheckedChange={(checked) => updateSetting("microTasksEnabled", checked)}
                aria-label="Activar micro-tareas"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  <Coffee className="h-4 w-4 inline mr-2" />
                  Descansos guiados
                </p>
                <p className="text-xs text-muted-foreground">Sugerencias de actividades durante los descansos</p>
              </div>
              <Switch
                checked={settings.guidedBreaks}
                onCheckedChange={(checked) => updateSetting("guidedBreaks", checked)}
                aria-label="Activar descansos guiados"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funciones Dislexia */}
      {settings.dyslexiaMode && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <BookOpen className="h-5 w-5 text-sky-500" />
              Funciones Dislexia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  <Volume2 className="h-4 w-4 inline mr-2" />
                  Texto a voz
                </p>
                <p className="text-xs text-muted-foreground">Botones para leer el contenido en voz alta</p>
              </div>
              <Switch
                checked={settings.textToSpeech}
                onCheckedChange={(checked) => updateSetting("textToSpeech", checked)}
                aria-label="Activar texto a voz"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  Resaltado manual
                </p>
                <p className="text-xs text-muted-foreground">Seleccioná y resaltá texto importante</p>
              </div>
              <Switch
                checked={settings.wordHighlighting}
                onCheckedChange={(checked) => updateSetting("wordHighlighting", checked)}
                aria-label="Activar resaltado"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funciones TEA */}
      {settings.autismMode && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
              <Brain className="h-5 w-5 text-emerald-500" />
              Funciones TEA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  <Focus className="h-4 w-4 inline mr-2" />
                  Modo foco
                </p>
                <p className="text-xs text-muted-foreground">Interfaz sin distracciones</p>
              </div>
              <Switch
                checked={settings.focusMode}
                onCheckedChange={(checked) => updateSetting("focusMode", checked)}
                aria-label="Activar modo foco"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  Animaciones reducidas
                </p>
                <p className="text-xs text-muted-foreground">Minimizá el movimiento y las transiciones</p>
              </div>
              <Switch
                checked={settings.reducedAnimations}
                onCheckedChange={(checked) => updateSetting("reducedAnimations", checked)}
                aria-label="Activar animaciones reducidas"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualización */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
            <Eye className="h-5 w-5" />
            Visualización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de tipografía — siempre visible */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                  <Type className="h-4 w-4 inline mr-2" />
                  Tipografía accesible
                </p>
                <p className="text-xs text-muted-foreground">
                  Activá y elegí la fuente que mejor te resulte
                </p>
              </div>
              <Switch
                checked={settings.useDyslexicFont}
                onCheckedChange={(checked) => updateSetting("useDyslexicFont", checked)}
                aria-label="Activar tipografía accesible"
              />
            </div>
            {settings.useDyslexicFont && (
              <div className="space-y-2 pt-1">
                {dyslexiaFontOptions.map((font) => {
                  const isSelected = settings.dyslexiaFont === font.id
                  return (
                    <button
                      key={font.id}
                      onClick={() => updateSetting("dyslexiaFont", font.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 bg-background"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground" style={font.style}>
                          {font.name}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed" style={font.style}>
                        {REFERENCE_TEXT}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Animaciones reducidas
              </p>
              <p className="text-xs text-muted-foreground">Minimizá el movimiento y las transiciones</p>
            </div>
            <Switch
              checked={settings.reducedAnimations}
              onCheckedChange={(checked) => updateSetting("reducedAnimations", checked)}
              aria-label="Activar animaciones reducidas"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Espaciado aumentado
              </p>
              <p className="text-xs text-muted-foreground">Más espacio entre los elementos</p>
            </div>
            <Switch
              checked={settings.increasedSpacing}
              onCheckedChange={(checked) => updateSetting("increasedSpacing", checked)}
              aria-label="Activar espaciado aumentado"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                UI simplificada
              </p>
              <p className="text-xs text-muted-foreground">Menos elementos y distracciones</p>
            </div>
            <Switch
              checked={settings.simplifiedUI}
              onCheckedChange={(checked) => updateSetting("simplifiedUI", checked)}
              aria-label="Activar UI simplificada"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audio */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", settings.dyslexiaMode && "tracking-wide")}>
            <Volume2 className="h-5 w-5" />
            Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Sonido de fondo
              </p>
              <p className="text-xs text-muted-foreground">Reproducir sonido ambiente durante el estudio</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
              aria-label="Activar sonido de fondo"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Texto a voz
              </p>
              <p className="text-xs text-muted-foreground">Leer el contenido en voz alta</p>
            </div>
            <Switch
              checked={settings.textToSpeech}
              onCheckedChange={(checked) => updateSetting("textToSpeech", checked)}
              aria-label="Activar texto a voz"
            />
          </div>
        </CardContent>
      </Card>

      {/* Restablecer */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Restablecer configuración
              </p>
              <p className="text-xs text-muted-foreground">Volver a pasar por el onboarding</p>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => { updateProfile("none"); resetOnboarding() }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Créditos */}
      <Card className="border-border/50 bg-muted/20">
        <CardHeader className="pb-3 text-center">
          <CardTitle className={cn("text-base font-semibold", settings.dyslexiaMode && "tracking-wide")}>
            Créditos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4 text-center">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Creadoras</p>
              <p className={cn("text-sm text-foreground leading-relaxed", settings.dyslexiaMode && "tracking-wide")}>
                Olivia Salas Cravero<br />
                Mia Cutillo<br />
                Juana Giammarini<br />
                Delfina Navarro
              </p>
            </div>
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Profesora</p>
              <p className={cn("text-sm text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Julieta Echart
              </p>
            </div>
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Colegio</p>
              <p className={cn("text-sm text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Santa María de Luján
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60 pt-2 tracking-widest font-light">
              MMXXVI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
