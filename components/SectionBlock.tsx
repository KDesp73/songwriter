"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { type Section } from "@/lib/types"
import { formatChord, capoInfo, chordBadgeColor, analyzeChord, getDiatonicChords, getChordRecommendations, gradeProgression, ALL_QUALITIES } from "@/lib/chords"
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
  beatsPerMeasure?: number
  metronome?: boolean
  waveform?: "triangle" | "sine" | "square" | "sawtooth"
  songKey: string
  songScale: "major" | "minor"
  onUpdateName: (name: string) => void
  onRemoveChord: (index: number) => void
  onReorderChord: (fromIndex: number, toIndex: number) => void
  onFocusSection: () => void
  onRemoveSection: () => void
  onTabChange: (tab: string) => void
  onLyricsChange: (lyrics: string) => void
  onAddChord: (chord: { root: string; quality: string }) => void
  onInsertChordAfter?: (index: number, chord: { root: string; quality: string }) => void
  onBeatsChange?: (index: number, beats: number) => void
  onQualityChange?: (index: number, quality: string) => void
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
  beatsPerMeasure = 4,
  metronome,
  waveform,
  songKey,
  songScale,
  onUpdateName,
  onRemoveChord,
  onReorderChord,
  onFocusSection,
  onRemoveSection,
  onTabChange,
  onLyricsChange,
  onAddChord,
  onInsertChordAfter,
  onBeatsChange,
  onQualityChange,
  canPaste,
  onCopySection,
  onPasteSection,
}: SectionBlockProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [ctxMenu, setCtxMenu] = useState<{ index: number; top: number; left: number } | null>(null)
  const dragIndex = useRef<number | null>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (showAddMenu && addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [showAddMenu])

  const diatonicChords = getDiatonicChords(songKey, songScale)

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Track header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 sm:gap-3 sm:px-4">
        <PlaybackButton
          progression={section.progression}
          bpm={bpm}
          metronome={metronome}
          waveform={waveform}
          onChordChange={setPlayingIndex}
          beatsPerMeasure={beatsPerMeasure}
        />
        <Input
          type="text"
          value={section.name}
          onChange={(e) => onUpdateName(e.target.value)}
          className="h-auto border-none bg-transparent p-0 text-base font-semibold tracking-tight shadow-none focus-visible:ring-0"
          placeholder="Section name"
        />
        {section.progression.length > 0 && (() => {
          const pg = gradeProgression(section.progression, songKey, songScale)
          return (
            <span className="ml-auto hidden text-sm text-muted-foreground sm:inline" title={pg.details.join(" • ")}>
              {section.progression.length} chord{section.progression.length !== 1 ? "s" : ""}
            </span>
          )
        })()}
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
      <div className="flex flex-wrap items-start gap-2 px-3 py-3 sm:px-4">
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
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCtxMenu({ index: i, top: e.clientY, left: e.clientX })
              }}
              onWheel={(e) => {
                e.preventDefault()
                const curIdx = ALL_QUALITIES.indexOf(slot.chord.quality as typeof ALL_QUALITIES[number])
                if (curIdx === -1) return
                const dir = e.deltaY > 0 ? 1 : -1
                const next = (curIdx + dir + ALL_QUALITIES.length) % ALL_QUALITIES.length
                onQualityChange?.(i, ALL_QUALITIES[next])
              }}
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
              <span className="flex items-center gap-0.5 opacity-50 transition-opacity hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onBeatsChange?.(i, Math.max(1, slot.beats - 1)) }}
                  className="flex size-3.5 items-center justify-center rounded text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  −
                </button>
                <span className="min-w-[1ch] text-center text-[10px] tabular-nums text-muted-foreground">
                  {slot.beats}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onBeatsChange?.(i, slot.beats + 1) }}
                  className="flex size-3.5 items-center justify-center rounded text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  +
                </button>
              </span>
            </div>
          )
        })}
        <div className="relative">
          <Button variant="outline" size="sm" ref={addBtnRef} onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); onFocusSection() }} className="h-7 gap-1 rounded-md text-xs font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Add
          </Button>
          {showAddMenu && createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div
                className="fixed z-50 mt-1 w-56 rounded-xl border bg-popover p-2 shadow-xl"
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                }}
                onClick={() => setShowAddMenu(false)}
              >
                <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-muted-foreground/70">
                  Diatonic chords
                </p>
                <div className="flex flex-wrap gap-1">
                  {diatonicChords.map((c, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); onAddChord({ root: c.root, quality: c.quality }); setShowAddMenu(false) }}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors hover:brightness-125 ${chordBadgeColor(c.quality)}`}
                    >
                      {formatChord(c.root, c.quality)}
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )}

          {ctxMenu && createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCtxMenu(null)} />
              <div
                className="fixed z-50 w-56 rounded-xl border bg-popover p-2 shadow-xl"
                style={{ top: ctxMenu.top, left: ctxMenu.left }}
                onClick={() => setCtxMenu(null)}
              >
                <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-muted-foreground/70">
                  Follows {formatChord(section.progression[ctxMenu.index].chord.root, section.progression[ctxMenu.index].chord.quality)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {getChordRecommendations(section.progression[ctxMenu.index].chord, songKey, songScale).map((rec, j) => (
                    <button
                      key={j}
                      onClick={(e) => {
                        e.stopPropagation()
                        onInsertChordAfter?.(ctxMenu.index, rec.chord)
                        setCtxMenu(null)
                      }}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors hover:brightness-125 ${chordBadgeColor(rec.chord.quality)}`}
                    >
                      {formatChord(rec.chord.root, rec.chord.quality)}
                      <span className="ml-1.5 text-[10px] opacity-60">{rec.label}</span>
                    </button>
                  ))}
                </div>
                {getChordRecommendations(section.progression[ctxMenu.index].chord, songKey, songScale).length === 0 && (
                  <p className="px-2 py-2 text-xs text-muted-foreground">Non-diatonic chord — no recommendations</p>
                )}
              </div>
            </>,
            document.body
          )}
        </div>
      </div>

      {/* Lyrics */}
      <LyricsEditor value={section.lyrics} onChange={onLyricsChange} />

      {/* Tab */}
      <TabEditor value={section.tab} onChange={onTabChange} />
    </div>
  )
}
