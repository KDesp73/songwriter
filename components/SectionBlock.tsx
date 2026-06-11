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
  CardFooter,
} from "@/components/ui/card"
import ChordDiagram from "./ChordDiagram"
import TabEditor from "./TabEditor"
import PlaybackButton from "./PlaybackButton"

interface SectionBlockProps {
  section: Section
  capoFret: number
  bpm: number
  onUpdateName: (name: string) => void
  onRemoveChord: (index: number) => void
  onFocusSection: () => void
  onRemoveSection: () => void
  onTabChange: (tab: string) => void
}

function ChordBadge({
  chord,
  capoFret,
  isPlaying,
  onRemove,
}: {
  chord: { root: string; quality: string }
  capoFret: number
  isPlaying: boolean
  onRemove: () => void
}) {
  const [tooltip, setTooltip] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const chordName = formatChord(chord.root, chord.quality)
  const info = capoFret > 0 ? capoInfo(chord, capoFret) : null
  const shape = findShape(chord.root, chord.quality)

  function show() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setTooltip({ top: r.top - 8, left: r.left + r.width / 2 })
    }
  }

  function hide() {
    setTooltip(null)
  }

  return (
    <span className="relative inline-flex">
      <span ref={ref} onMouseEnter={show} onMouseLeave={hide}>
        <Badge
          variant={isPlaying ? "default" : "outline"}
          className={`gap-2 py-1.5 pl-3 pr-1.5 text-sm transition-all ${
            isPlaying ? "scale-110 shadow-md" : ""
          }`}
        >
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

      {tooltip && shape && createPortal(
        <div
          style={{
            position: "fixed",
            top: tooltip.top,
            left: tooltip.left,
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
  bpm,
  onUpdateName,
  onRemoveChord,
  onFocusSection,
  onRemoveSection,
  onTabChange,
}: SectionBlockProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlaybackButton
            progression={section.progression}
            bpm={bpm}
            onChordChange={setPlayingIndex}
          />
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
              isPlaying={playingIndex === i}
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
      <CardFooter className="flex-col items-stretch gap-0 border-t-0 bg-transparent pt-0">
        <TabEditor value={section.tab} onChange={onTabChange} />
      </CardFooter>
    </Card>
  )
}
