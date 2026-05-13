"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { NeuroStudyLogo } from "@/components/ui/neurostudy-logo"

export function TeacherRegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error("Supabase no configurado")

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error("No se pudo crear el usuario")

      // If no immediate session, try signing in (handles both auto-confirm on/off)
      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError || !signInData.session) {
          setError("Revisá tu correo y confirmá tu cuenta. Luego iniciá sesión desde esta misma página.")
          return
        }
      }

      // Wait briefly so ensureUserRecords (role: student) runs first, then we overwrite
      await new Promise((r) => setTimeout(r, 400))

      await supabase.from("user_profiles").upsert(
        { id: data.user.id, name, role: "teacher", email },
        { onConflict: "id" }
      )
      // Double-check with an explicit update in case upsert was blocked
      await supabase.from("user_profiles").update({ role: "teacher", name, email }).eq("id", data.user.id)

      router.push("/teacher")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <NeuroStudyLogo size={72} />
          </div>
          <CardTitle className="text-xl">Registro Docente</CardTitle>
          <CardDescription>Creá tu cuenta para gestionar tu espacio educativo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Prof. García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link href="/teacher/login" className="text-primary underline underline-offset-2">
                Iniciar sesión
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/" className="hover:underline">
                ← Volver a la app de alumnos
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
