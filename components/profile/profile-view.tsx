"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { useAccessibility, type AccessibilityProfile } from "@/contexts/accessibility-context"
import { cn } from "@/lib/utils"
import { User, Camera, Check, Brain, BookOpen, Sparkles, LogOut, Loader2, X, FolderOpen } from "lucide-react"

// ── Camera modal ──────────────────────────────────────────────────────────────
function CameraModal({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        })
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setIsReady(true)
        }
      } catch {
        setCameraError("No se pudo acceder a la cámara. Verificá los permisos del navegador.")
      }
    }
    start()
    return () => {
      active = false
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(dataUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Tomar foto</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {cameraError ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{cameraError}</p>
          </div>
        ) : (
          <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleCapture}
            disabled={!isReady || !!cameraError}
          >
            <Camera className="h-4 w-4" />
            Capturar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Profiles ──────────────────────────────────────────────────────────────────
const profiles = [
  {
    id: "none" as const,
    title: "Ninguno",
    description: "Configuración predeterminada",
    icon: User,
    color: "bg-muted/50 border-muted",
    iconColor: "text-muted-foreground",
  },
  {
    id: "adhd" as const,
    title: "TDAH",
    description: "Sesiones cortas, recordatorios, UI simplificada",
    icon: Sparkles,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
  {
    id: "dyslexia" as const,
    title: "Dislexia",
    description: "Fuentes amigables, espaciado, texto a voz",
    icon: BookOpen,
    color: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-600",
  },
  {
    id: "autism" as const,
    title: "Espectro Autista",
    description: "Colores calmados, diseño consistente",
    icon: Brain,
    color: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
  },
]

// ── ProfileView ───────────────────────────────────────────────────────────────
export function ProfileView() {
  const router = useRouter()
  const { user, updateProfile, signOut } = useSupabaseAuth()
  const { settings, updateProfile: updateAccessibilityProfile } = useAccessibility()

  const [name, setName] = useState(user?.name || "")
  const [hasNameChanges, setHasNameChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync name when user profile loads (deferred after OAuth)
  useEffect(() => {
    if (user?.name && !hasNameChanges) {
      setName(user.name)
    }
  }, [user?.name, hasNameChanges])

  const handleNameChange = (value: string) => {
    setName(value)
    setHasNameChanges(value !== (user?.name || ""))
  }

  const handleSaveName = async () => {
    if (!name.trim()) {
      setSaveError("El nombre no puede estar vacío.")
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateProfile({ name: name.trim() })
      setHasNameChanges(false)
      showSaveSuccessToast()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar el nombre. Intentá de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        await updateProfile({ profilePicture: reader.result as string })
        showSaveSuccessToast()
      } catch {
        setSaveError("No se pudo subir la imagen.")
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = async (dataUrl: string) => {
    setShowCamera(false)
    try {
      await updateProfile({ profilePicture: dataUrl })
      showSaveSuccessToast()
    } catch {
      setSaveError("No se pudo guardar la foto.")
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      await updateProfile({ profilePicture: null })
      showSaveSuccessToast()
    } catch {
      setSaveError("No se pudo eliminar la imagen.")
    }
  }

  const handleProfileSelect = (profile: AccessibilityProfile) => {
    updateAccessibilityProfile(profile)
    showSaveSuccessToast()
  }

  const showSaveSuccessToast = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  if (!user) return null

  return (
    <div className={cn("space-y-6", settings.increasedSpacing && "space-y-8")}>
      {/* Camera modal */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Toast de éxito */}
      <div className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        saveSuccess ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white shadow-lg">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Cambios guardados</span>
        </div>
      </div>

      {/* Foto y nombre */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold", settings.dyslexiaMode && "tracking-wide")}>
            Información personal
          </CardTitle>
          <CardDescription className={cn(settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
            Gestioná tu información de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user.profilePicture || undefined} alt={user.name || "Perfil"} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {user.name ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Botones de foto */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Elegir archivo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-3.5 w-3.5" />
                Tomar foto
              </Button>
            </div>

            {user.profilePicture && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleRemoveProfilePicture}
              >
                <X className="h-4 w-4 mr-1" />
                Eliminar foto
              </Button>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className={cn(settings.dyslexiaMode && "tracking-wide")}>
              Nombre completo
            </Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ingresá tu nombre"
                className="h-11"
              />
              <Button
                onClick={handleSaveName}
                disabled={isSaving}
                className="shrink-0"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          </div>

          {/* Email (solo lectura) */}
          <div className="space-y-2">
            <Label className={cn(settings.dyslexiaMode && "tracking-wide")}>Email</Label>
            <Input value={user.email} disabled className="h-11 bg-muted/50" />
            <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
          </div>
        </CardContent>
      </Card>

      {/* Perfil de aprendizaje */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className={cn("text-lg font-semibold", settings.dyslexiaMode && "tracking-wide")}>
            Preferencia de aprendizaje
          </CardTitle>
          <CardDescription className={cn(settings.dyslexiaMode && "tracking-wide leading-relaxed")}>
            Seleccioná una opción para personalizar tu experiencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.map((profile) => {
            const Icon = profile.icon
            const isSelected = settings.profile === profile.id
            return (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  profile.color,
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white", profile.iconColor)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                        {profile.title}
                      </h3>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </div>
                    <p className={cn("text-xs text-muted-foreground mt-0.5", settings.dyslexiaMode && "tracking-wide")}>
                      {profile.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Cerrar sesión */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-medium text-foreground", settings.dyslexiaMode && "tracking-wide")}>
                Cerrar sesión
              </p>
              <p className="text-xs text-muted-foreground">Salir de tu cuenta</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
