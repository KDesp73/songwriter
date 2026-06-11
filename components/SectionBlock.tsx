"use client"

import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { type Section } from "@/lib/types"
import { formatChord, capoInfo } from "@/lib/chords"
import { findShape } from "@/lib/chordShapes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardAction,
} from "@/components/ui/card"
import ChordDiagram from "./ChordDiagram"

interface SectionBlockProps {
  section: Section
  capoFret: number
  onUpdateName: (name: string) => void
  onRemoveChord: (index: number) => void
  onFocusSection: () => void
  onRemoveSection: () => void
}

function ChordBadge({
  chord,
  capoFret,
  onRemove,
}: {
  chord: { root: string; quality: string }
  capoFret: number
  onRemove: () => void
}) {
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const chordName = formatChord(chord.root, chord.quality)
  const info = capoFret > 0 ? capoInfo(chord, capoFret) : null
  const shape = findShape(chord.root, chord.quality)

  function show() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setTooltipPos({ top: rect.top - 8, left: rect.left + rect.width / 2 })
    }
  }

  function hide() {
    setTooltipPos(null)
  }

  return (
    <span className="relative inline-flex">
      <span ref={ref} onMouseEnter={show} onMouseLeave={hide}>
        <Badge variant="outline" className="gap-2 py-1.5 pl-3 pr-1.5 text-sm">
          {info ? (
            <span title={`Shape: ${info.shape} → Sounds: ${info.actual}`}>
              {info.shape}
              <span className="text-xs text-muted-foreground"> ({info.actual})</span>
            </span>
          ) : (
            chordName
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${chordName}`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </Badge>
      </span>

      {tooltipPos && shape && createPortal(
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translate(-50%, -100%)",
          }}
          className="z-50 rounded-xl border bg-popover p-2 shadow-md ring-1 ring-foreground/10"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <ChordDiagram shape={shape} />
        </div>,
        document.body,
      )}
    </span>
  )
}

export default function SectionBlock({
  section,
  capoFret,
  onUpdateName,
  onRemoveChord,
  onFocusSection,
  onRemoveSection,
}: SectionBlockProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={section.name}
            onChange={(e) => onUpdateName(e.target.value)}
            className="h-auto border-none bg-transparent p-0 text-base font-medium shadow-none focus-visible:ring-0"
            placeholder="Section name"
          />
          {section.progression.length > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {section.progression.length}
            </Badge>
          )}
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveSection()
            }}
            aria-label="Remove section"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {section.progression.map((slot, i) => (
            <ChordBadge
              key={i}
              chord={slot.chord}
              capoFret={capoFret}
              onRemove={() => onRemoveChord(i)}
            />
          ))}
          <Button variant="outline" size="sm" onClick={onFocusSection}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add chord
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
