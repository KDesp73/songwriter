"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface LyricsEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function LyricsEditor({ value, onChange }: LyricsEditorProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="h-8 gap-1.5 rounded-none border-t border-border px-4 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {expanded ? (
            <path d="M4 9L7 6L10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M4 5L7 8L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        Lyrics
        {value.trim() && !expanded && (
          <span className="ml-1 text-xs text-muted-foreground/60">
            ({value.trim().split("\n").length} lines)
          </span>
        )}
      </Button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[100px] w-full resize-y whitespace-pre-wrap rounded-lg border bg-background/50 p-3 font-sans text-sm leading-relaxed text-foreground/90 outline-none transition-colors placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            placeholder="Write lyrics here..."
            spellCheck
          />
        </div>
      )}
    </div>
  )
}
