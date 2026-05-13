"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Highlighter, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/contexts/accessibility-context"

interface Highlight {
  id: string
  text: string
  startOffset: number
  endOffset: number
}

interface TextHighlighterProps {
  children: React.ReactNode
  className?: string
}

export function TextHighlighter({ children, className }: TextHighlighterProps) {
  const { settings } = useAccessibility()
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  const handleHighlight = useCallback(() => {
    if (!isHighlightMode) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    
    const selectedText = selection.toString().trim()
    if (!selectedText) return
    
    const range = selection.getRangeAt(0)
    
    // Create highlight
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    }
    
    setHighlights((prev) => [...prev, newHighlight])
    
    // Apply visual highlight
    const span = document.createElement("span")
    span.className = "bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5"
    span.dataset.highlightId = newHighlight.id
    
    try {
      range.surroundContents(span)
    } catch {
      // Handle complex selections that cross element boundaries
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
    }
    
    selection.removeAllRanges()
  }, [isHighlightMode])

  const clearAllHighlights = useCallback(() => {
    setHighlights([])
    if (contentRef.current) {
      const highlightedSpans = contentRef.current.querySelectorAll("[data-highlight-id]")
      highlightedSpans.forEach((span) => {
        const parent = span.parentNode
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span)
          }
          parent.removeChild(span)
        }
      })
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      if (isHighlightMode) {
        handleHighlight()
      }
    }
    
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [isHighlightMode, handleHighlight])

  // Only show for dyslexia mode with word highlighting enabled
  if (!settings.dyslexiaMode || !settings.wordHighlighting) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("relative", className)}>
      {/* Highlight Controls */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-800">
        <Button
          variant={isHighlightMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsHighlightMode(!isHighlightMode)}
          className={cn(
            "gap-1.5",
            isHighlightMode && "bg-yellow-500 hover:bg-yellow-600 text-black"
          )}
        >
          {isHighlightMode ? (
            <>
              <X className="h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <Highlighter className="h-4 w-4" />
              Highlight Text
            </>
          )}
        </Button>
        
        {highlights.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllHighlights}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear All ({highlights.length})
          </Button>
        )}
        
        {isHighlightMode && (
          <span className="text-xs text-muted-foreground ml-auto">
            Select text to highlight
          </span>
        )}
      </div>
      
      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          isHighlightMode && "cursor-text select-text",
          settings.dyslexiaMode && "leading-relaxed tracking-wide"
        )}
      >
        {children}
      </div>
    </div>
  )
}
