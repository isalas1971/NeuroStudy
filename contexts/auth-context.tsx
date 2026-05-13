// DEPRECATED: Este archivo ya no está en uso.
// Todo el sistema de auth migró a supabase-auth-context.tsx
// Mantener hasta confirmar que no rompe ningún import residual, luego eliminar.
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  name: string
  profilePicture: string | null
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<Pick<User, "name" | "profilePicture">>) => void
  verifyPassword: (password: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simulated password storage (in real app, this would be hashed on backend)
const STORAGE_KEY = "neurostudy-auth"
const USERS_KEY = "neurostudy-users"

interface StoredUser extends User {
  password: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentPassword, setCurrentPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedAuth = localStorage.getItem(STORAGE_KEY)
    if (storedAuth) {
      try {
        const { userId, password } = JSON.parse(storedAuth)
        const users = getStoredUsers()
        const foundUser = users.find((u) => u.id === userId)
        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser
          setUser(userWithoutPassword)
          setCurrentPassword(password)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const getStoredUsers = (): StoredUser[] => {
    try {
      const stored = localStorage.getItem(USERS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  const validateEmail = (email: string): boolean => {
    // Gmail format validation
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    return gmailRegex.test(email)
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    const users = getStoredUsers()
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!foundUser) {
      return { success: false, error: "No account found with this email" }
    }

    if (foundUser.password !== password) {
      return { success: false, error: "Incorrect password" }
    }

    const { password: _, ...userWithoutPassword } = foundUser
    setUser(userWithoutPassword)
    setCurrentPassword(password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: foundUser.id, password }))

    return { success: true }
  }

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!email || !password || !name) {
      return { success: false, error: "All fields are required" }
    }

    if (!validateEmail(email)) {
      return { success: false, error: "Please use a valid Gmail address" }
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    const users = getStoredUsers()
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" }
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      profilePicture: null,
      password,
      createdAt: new Date(),
    }

    users.push(newUser)
    saveUsers(users)

    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    setCurrentPassword(password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: newUser.id, password }))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setCurrentPassword("")
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateProfile = (updates: Partial<Pick<User, "name" | "profilePicture">>) => {
    if (!user) return

    const users = getStoredUsers()
    const userIndex = users.findIndex((u) => u.id === user.id)

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      saveUsers(users)

      setUser((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  const verifyPassword = (password: string): boolean => {
    return password === currentPassword
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        verifyPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
