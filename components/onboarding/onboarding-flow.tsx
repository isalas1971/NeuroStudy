"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAccessibility, type AccessibilityProfile, type DyslexiaFont } from "@/contexts/accessibility-context"
import { Brain, BookOpen, Sparkles, ArrowRight, Check, ArrowLeft, Type } from "lucide-react"
import { cn } from "@/lib/utils"

const profiles = [
  {
    id: "adhd" as const,
    title: "TDAH",
    description: "Sesiones más cortas, micro-tareas, pausas guiadas, temporizadores visuales",
    icon: Sparkles,
    color: "bg-amber-50 border-amber-200 hover:border-amber-300",
    iconColor: "text-amber-600",
  },
  {
    id: "dyslexia" as const,
    title: "Dislexia",
    description: "Tipografía adaptada, texto a voz, resaltado de palabras",
    icon: BookOpen,
    color: "bg-sky-50 border-sky-200 hover:border-sky-300",
    iconColor: "text-sky-600",
  },
  {
    id: "autism" as const,
    title: "Autismo (TEA)",
    description: "Interfaz limpia, animaciones reducidas, modo foco, estructura predecible",
    icon: Brain,
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    iconColor: "text-emerald-600",
  },
]

type PetType = "cat" | "dog" | "bunny" | "hamster"

const petOptions: { type: PetType; emoji: string; name: string }[] = [
  { type: "cat", emoji: "🐱", name: "Gato" },
  { type: "dog", emoji: "🐶", name: "Perro" },
  { type: "bunny", emoji: "🐰", name: "Conejo" },
  { type: "hamster", emoji: "🐹", name: "Hámster" },
]

const dyslexiaFonts: { id: DyslexiaFont; name: string; description: string; style: React.CSSProperties }[] = [
  {
    id: "opendyslexic",
    name: "OpenDyslexic",
    description: "Diseñada especialmente para dislexia",
    style: { fontFamily: "'OpenDyslexic', sans-serif", letterSpacing: "0.05em", lineHeight: "1.8" },
  },
  {
    id: "lexend",
    name: "Lexend",
    description: "Reduce el esfuerzo visual al leer",
    style: { fontFamily: "'Lexend', sans-serif", letterSpacing: "0.03em", lineHeight: "1.7" },
  },
  {
    id: "arial",
    name: "Arial",
    description: "Familiar y fácil de leer",
    style: { fontFamily: "Arial, sans-serif", letterSpacing: "0.04em", lineHeight: "1.7" },
  },
  {
    id: "helvetica",
    name: "Helvetica",
    description: "Clara y limpia, sin adornos",
    style: { fontFamily: "Helvetica, Arial, sans-serif", letterSpacing: "0.04em", lineHeight: "1.7" },
  },
]

const REFERENCE_TEXT = "El rápido zorro marrón salta sobre el perro perezoso. Estudiar se vuelve más fácil."

export function OnboardingFlow() {
  const { updateProfile, updateSetting, updateGamification, gamification, completeOnboarding, settings } = useAccessibility()
  const [step, setStep] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState<AccessibilityProfile>("none")
  const [selectedFont, setSelectedFont] = useState<DyslexiaFont>("opendyslexic")
  const [selectedPet, setSelectedPet] = useState<PetType>("cat")
  const [petName, setPetName] = useState("Buddy")

  const isDyslexia = selectedProfile === "dyslexia"
  const totalSteps = isDyslexia ? 4 : 3

  const handleProfileSelect = (profile: AccessibilityProfile) => {
    setSelectedProfile(profile)
  }

  const handleContinue = () => {
    if (step === 0) {
      setStep(1)
    } else if (step === 1) {
      updateProfile(selectedProfile)
      if (isDyslexia) {
        setStep(2)
      } else {
        setStep(3)
      }
    } else if (step === 2) {
      // Font selection step (only when dyslexia)
      updateSetting("dyslexiaFont", selectedFont)
      updateSetting("useDyslexicFont", true)
      setStep(3)
    } else {
      updateGamification("pet", {
        ...gamification.pet,
        name: petName,
        type: selectedPet,
      })
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    updateProfile("none")
    completeOnboarding()
  }

  const handleBack = () => {
    if (step === 3 && isDyslexia) {
      setStep(2)
    } else if (step > 0) {
      setStep(step - 1)
    }
  }

  const stepIndicatorCount = totalSteps
  const currentIndicatorStep = step === 3 ? stepIndicatorCount - 1 : step

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 bg-background",
      settings.reducedAnimations ? "" : "animate-in fade-in duration-500"
    )}>
      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: stepIndicatorCount }).map((_, s) => (
            <div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                s === currentIndicatorStep ? "w-8 bg-primary" : s < currentIndicatorStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-semibold text-balance">
                Bienvenido a NeuroStudy
              </CardTitle>
              <CardDescription className="text-base mt-2 text-balance">
                Tu compañero de estudio personalizado para aprender mejor,
                organizarte y alcanzar tus metas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  ¿Querés personalizar tu experiencia de estudio?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" onClick={handleContinue} className="gap-2">
                    Sí, personalizar mi experiencia
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleSkip}>
                    Saltar por ahora
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Podés cambiar estas opciones en cualquier momento desde tu perfil
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Profile selection */}
        {step === 1 && (
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-semibold text-balance">
                Personalizá tu Experiencia
              </CardTitle>
              <CardDescription className="text-base mt-2 text-pretty">
                Seleccioná la opción que mejor describe tu estilo de aprendizaje.
                No es un diagnóstico — es solo una forma de adaptar la app para vos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-8">
              <div className="space-y-3">
                {profiles.map((profile) => {
                  const Icon = profile.icon
                  const isSelected = selectedProfile === profile.id

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
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white",
                          profile.iconColor
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-foreground">{profile.title}</h3>
                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{profile.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}

                <button
                  onClick={() => handleProfileSelect("none")}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    "bg-muted/50 border-muted hover:border-muted-foreground/20",
                    selectedProfile === "none" && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Sin preferencia — usar configuración por defecto</span>
                    {selectedProfile === "none" && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </button>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={handleContinue} className="flex-1 gap-2">
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="ghost" onClick={handleBack} className="sm:w-auto gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Podés combinar o cambiar estas opciones en cualquier momento.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Font selection (only for dyslexia profile) */}
        {step === 2 && isDyslexia && (
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
                <Type className="h-8 w-8 text-sky-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-balance">
                Elegí tu Tipografía
              </CardTitle>
              <CardDescription className="text-base mt-2 text-pretty">
                Probá cada opción con el texto de muestra y elegí la que te resulte más cómoda para leer.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-8">
              <div className="space-y-3">
                {dyslexiaFonts.map((font) => {
                  const isSelected = selectedFont === font.id
                  return (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                        "bg-background hover:border-primary/50",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="font-semibold text-foreground" style={font.style}>
                            {font.name}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">{font.description}</p>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed" style={font.style}>
                        {REFERENCE_TEXT}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={handleContinue} className="flex-1 gap-2">
                  Continuar con {dyslexiaFonts.find(f => f.id === selectedFont)?.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="ghost" onClick={handleBack} className="sm:w-auto gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Podés cambiar la tipografía en cualquier momento desde Ajustes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Pet selection */}
        {step === 3 && (
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-semibold text-balance">
                Conocé a tu Compañero de Estudio
              </CardTitle>
              <CardDescription className="text-base mt-2 text-pretty">
                Elegí una mascota para mantenerte motivado.
                ¡Ganás puntos estudiando para comprarle cosas!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-8">
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  {petOptions.map((pet) => (
                    <button
                      key={pet.type}
                      onClick={() => setSelectedPet(pet.type)}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                        "hover:border-primary/50",
                        selectedPet === pet.type
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <span className="text-4xl mb-2">{pet.emoji}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        selectedPet === pet.type ? "text-primary" : "text-muted-foreground"
                      )}>
                        {pet.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Poné un nombre a tu compañero
                  </label>
                  <Input
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Ingresá un nombre..."
                    className="text-center text-lg"
                    maxLength={20}
                  />
                </div>

                <div className="flex flex-col items-center py-4 px-6 bg-muted/30 rounded-xl">
                  <span className="text-6xl mb-2">
                    {petOptions.find(p => p.type === selectedPet)?.emoji}
                  </span>
                  <p className="text-lg font-medium text-foreground">
                    {petName || "Tu Compañero"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nivel 1 {petOptions.find(p => p.type === selectedPet)?.name}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  className="flex-1 gap-2"
                  disabled={!petName.trim()}
                >
                  ¡Empezar a Estudiar!
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="ghost" onClick={handleBack} className="sm:w-auto gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
