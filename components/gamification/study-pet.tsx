"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Star, ShoppingBag, Cookie, Shirt, Moon, Circle } from "lucide-react"

type PetType = "cat" | "dog" | "bunny" | "hamster"

interface StudyPetProps {
  compact?: boolean
}

const petEmojis: Record<PetType, { normal: string; happy: string; sleepy: string }> = {
  cat: { normal: "🐱", happy: "😺", sleepy: "😸" },
  dog: { normal: "🐶", happy: "🐕", sleepy: "🐕‍🦺" },
  bunny: { normal: "🐰", happy: "🐇", sleepy: "🐰" },
  hamster: { normal: "🐹", happy: "🐹", sleepy: "🐹" },
}

export function StudyPet({ compact = false }: StudyPetProps) {
  const { settings, gamification, purchaseItem } = useAccessibility()
  const { pet, points } = gamification
  const [activeTab, setActiveTab] = useState("pet")
  
  const petMood = pet.happiness > 80 ? "happy" : pet.happiness > 40 ? "normal" : "sleepy"
  const petEmoji = petEmojis[pet.type][petMood]
  
  const ownedAccessories = pet.items.filter(item => item.type === "accessory" && item.owned)
  
  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <div 
          className={cn(
            "relative w-24 h-24 flex items-center justify-center",
            "bg-gradient-to-b from-primary/10 to-primary/5 rounded-full",
            !settings.reducedAnimations && "animate-pulse"
          )}
        >
          <span className="text-5xl" role="img" aria-label={`${pet.type} pet`}>
            {petEmoji}
          </span>
          {ownedAccessories.length > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
              <Star className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="mt-2 text-center">
          <p className={cn(
            "text-sm font-medium text-foreground",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            {pet.name}
          </p>
          <div className="flex items-center gap-1 justify-center mt-1">
            <Heart className="h-3 w-3 text-red-400" />
            <span className="text-xs text-muted-foreground">
              {pet.happiness}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  const itemTypes = [
    { type: "food" as const, icon: Cookie, label: "Comida" },
    { type: "accessory" as const, icon: Shirt, label: "Accesorios" },
    { type: "bed" as const, icon: Moon, label: "Camas" },
    { type: "bowl" as const, icon: Circle, label: "Platos" },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-base font-semibold",
            settings.dyslexiaMode && "tracking-wide"
          )}>
            Mi Mascota de Estudio
          </CardTitle>
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">{points}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pet">Mascota</TabsTrigger>
            <TabsTrigger value="shop" className="gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              Tienda
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pet" className="space-y-4">
            <div className="flex flex-col items-center py-4">
              <div 
                className={cn(
                  "relative w-32 h-32 flex items-center justify-center",
                  "bg-gradient-to-b from-primary/10 to-primary/5 rounded-full mb-4",
                  !settings.reducedAnimations && "transition-transform hover:scale-105"
                )}
              >
                <span className="text-7xl" role="img" aria-label={`${pet.type} pet`}>
                  {petEmoji}
                </span>
              </div>
              
              <h3 className={cn(
                "text-lg font-semibold text-foreground",
                settings.dyslexiaMode && "tracking-wide"
              )}>
                {pet.name}
              </h3>
              
              <p className="text-sm text-muted-foreground">
                Level {pet.level} {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
              </p>
              
              {/* Happiness bar */}
              <div className="w-full max-w-xs mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-400" />
                    Felicidad
                  </span>
                  <span className="text-xs font-medium">{pet.happiness}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      pet.happiness > 60 ? "bg-green-400" : 
                      pet.happiness > 30 ? "bg-amber-400" : "bg-red-400",
                      !settings.reducedAnimations && "transition-all duration-500"
                    )}
                    style={{ width: `${pet.happiness}%` }}
                  />
                </div>
              </div>
              
              {/* Owned items display */}
              {ownedAccessories.length > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg w-full">
                  <p className="text-xs text-muted-foreground mb-2">Usando:</p>
                  <div className="flex flex-wrap gap-2">
                    {ownedAccessories.map(item => (
                      <span 
                        key={item.id}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="shop" className="space-y-4">
            {itemTypes.map(({ type, icon: Icon, label }) => {
              const typeItems = pet.items.filter(item => item.type === type)
              
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "text-sm font-medium",
                      settings.dyslexiaMode && "tracking-wide"
                    )}>
                      {label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {typeItems.map(item => {
                      const isPurchasable = item.consumable || !item.owned
                      return (
                        <Button
                          key={item.id}
                          variant={item.owned && !item.consumable ? "secondary" : "outline"}
                          size="sm"
                          className={cn(
                            "h-auto py-2 flex-col gap-1",
                            item.owned && !item.consumable && "border-primary/30"
                          )}
                          disabled={(!item.consumable && item.owned) || points < item.cost}
                          onClick={() => purchaseItem(item.id, item.cost)}
                        >
                          <span className="text-xs truncate w-full text-center">{item.name}</span>
                          {isPurchasable && (
                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5" />
                              {item.cost}
                            </span>
                          )}
                          {item.owned && !item.consumable && (
                            <span className="text-[10px] text-green-600">Comprado</span>
                          )}
                          {item.consumable && (
                            <span className="text-[10px] text-sky-600">Consumible</span>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
