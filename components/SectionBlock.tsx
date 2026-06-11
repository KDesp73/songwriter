"use client"

import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { type Section } from "@/lib/types"
import { formatChord, capoInfo, chordBadgeColor, analyzeChord } from "@/lib/chords"
import { findShape } from "@/lib/chordShapes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ChordDiagram from "./ChordDiagram"
import LyricsEditor from "./LyricsEditor"
import TabEditor from "./TabEditor"
import PlaybackButton from "./PlaybackButton"

interface SectionBlockProps {
  section: Section
  capoFret: number
  bpm: number
  metronome?: boolean
  songKey: string
  songScale: "major" | "minor"
  onUpdateName: (name: string) => void
  onRemoveChord: (index: number) => void
  onReorderChord: (fromIndex: number, toIndex: number) => void
  onFocusSection: () => void
  onRemoveSection: () => void
  onTabChange: (tab: string) => void
  onLyricsChange: (lyrics: string) => void
  canPaste: boolean
  onCopySection: () => void
  onPasteSection: () => void
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
        <span
          className={`inline-flex cursor-default items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-semibold transition-all ${
            isPlaying ? "scale-110 !border-primary !bg-primary !text-primary-foreground shadow-lg shadow-primary/30" : chordBadgeColor(chord.quality)
          }`}
        >
          {info ? (
            <span title={`Shape: ${info.shape} → Sounds: ${info.actual}`}>
              {info.shape}
              <span className="text-xs font-normal opacity-60"> ({info.actual})</span>
            </span>
          ) : (
            chordName
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="-mr-0.5 flex size-4 items-center justify-center rounded-full opacity-40 transition-all hover:bg-black/20 hover:opacity-100"
            aria-label={`Remove ${chordName}`}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M2 2L7 7M7 2L2 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      </span>

      {tooltip && shape && createPortal(
        <div
          style={{
            position: "fixed",
            top: tooltip.top,
            left: tooltip.left,
            transform: "translate(-50%, -100%)",
          }}
          className="z-50 rounded-xl border bg-popover p-2.5 shadow-xl"
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
  metronome,
  songKey,
  songScale,
  onUpdateName,
  onRemoveChord,
  onReorderChord,
  onFocusSection,
  onRemoveSection,
  onTabChange,
  onLyricsChange,
  canPaste,
  onCopySection,
  onPasteSection,
}: SectionBlockProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndex = useRef<number | null>(null)

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Track header */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
        <PlaybackButton
          progression={section.progression}
          bpm={bpm}
          metronome={metronome}
          onChordChange={setPlayingIndex}
        />
        <Input
          type="text"
          value={section.name}
          onChange={(e) => onUpdateName(e.target.value)}
          className="h-auto border-none bg-transparent p-0 text-base font-semibold tracking-tight shadow-none focus-visible:ring-0"
          placeholder="Section name"
        />
        {section.progression.length > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {section.progression.length} chord{section.progression.length !== 1 ? "s" : ""}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onCopySection() }}
          className="flex size-5 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-foreground"
          aria-label="Copy section"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="4" y="2.5" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
            <path d="M2 5.5V10.5C2 11.05 2.45 11.5 3 11.5H8" stroke="currentColor" strokeWidth="1.1" fill="none" />
          </svg>
        </button>
        {canPaste && (
          <button
            onClick={(e) => { e.stopPropagation(); onPasteSection() }}
            className="flex size-5 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-foreground"
            aria-label="Paste after section"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="3.5" y="2.5" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
              <path d="M5.5 6.5H8.5M7 5V8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemoveSection()
          }}
          className="flex size-5 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove section"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M3.5 3.5L9.5 9.5M9.5 3.5L3.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Chord row */}
      <div className="flex flex-wrap items-start gap-2 px-4 py-3">
        {section.progression.map((slot, i) => {
          const analysis = analyzeChord(slot.chord, songKey, songScale)
          return (
            <div
              key={i}
              draggable
              onDragStart={() => { dragIndex.current = i }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i) }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => {
                if (dragIndex.current !== null && dragIndex.current !== i) {
                  onReorderChord(dragIndex.current, i)
                }
                setDragOverIndex(null)
                dragIndex.current = null
              }}
              onDragEnd={() => { setDragOverIndex(null); dragIndex.current = null }}
              className={`flex flex-col items-center gap-0.5 rounded-md px-1 transition-all ${
                dragOverIndex === i ? "pt-4" : ""
              }`}
            >
              <ChordBadge
                chord={slot.chord}
                capoFret={capoFret}
                isPlaying={playingIndex === i}
                onRemove={() => onRemoveChord(i)}
              />
              <span className={`text-[10px] leading-none ${analysis.isDiatonic ? "text-muted-foreground/60" : "text-amber-400/60"}`}>
                {analysis.function || analysis.romanNumeral}
              </span>
            </div>
          )
        })}
        <Button variant="outline" size="sm" onClick={onFocusSection} className="h-7 gap-1 rounded-md text-xs font-medium">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Add
        </Button>
      </div>

      {/* Lyrics */}
      <LyricsEditor value={section.lyrics} onChange={onLyricsChange} />

      {/* Tab */}
      <TabEditor value={section.tab} onChange={onTabChange} />
    </div>
  )
}
