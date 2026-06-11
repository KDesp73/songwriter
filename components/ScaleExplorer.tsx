"use client"

import { useState } from "react"
import { NOTES, SCALE_PATTERNS, getScaleNotes, getDiatonicChords, formatChord, noteName, semitoneOf } from "@/lib/chords"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const STRING_OPEN = [4, 9, 2, 7, 11, 4]
const FRET_COUNT = 12
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"]

const SCALE_NAMES: Record<string, string> = {
  major: "Major",
  "natural minor": "Natural Minor",
  harmonic: "Harmonic Minor",
  melodic: "Melodic Minor",
  dorian: "Dorian",
  phrygian: "Phrygian",
  lydian: "Lydian",
  mixolydian: "Mixolydian",
  locrian: "Locrian",
}

const MAJOR_LIKE = new Set(["major", "lydian", "mixolydian"])

interface ScaleExplorerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ScaleExplorer({ open, onOpenChange }: ScaleExplorerProps) {
  const [root, setRoot] = useState("C")
  const [pattern, setPattern] = useState("major")

  const scaleNotes = getScaleNotes(root, pattern)
  const scaleNoteSet = new Set(scaleNotes)
  const scaleType = MAJOR_LIKE.has(pattern) ? "major" : "minor"
  const chords = getDiatonicChords(root, scaleType)
  const intervals = SCALE_PATTERNS[pattern] ?? SCALE_PATTERNS.major

  const fretSpacing = 44
  const stringSpacing = 16
  const paddingLeft = 20
  const svgWidth = paddingLeft + (FRET_COUNT + 1) * fretSpacing + 10
  const svgHeight = 10 + STRING_LABELS.length * stringSpacing + 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scale Explorer</DialogTitle>
          <DialogDescription>
            Explore scales, modes, and their diatonic chords
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Root</span>
            <Select value={root} onValueChange={(v) => v && setRoot(v)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTES.map((note) => (
                  <SelectItem key={note} value={note}>{note}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Scale</span>
            <Select value={pattern} onValueChange={(v) => v && setPattern(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCALE_NAMES).map(([key, name]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Notes</h4>
          <div className="flex flex-wrap gap-1.5">
            {intervals.map((interval, i) => {
              const semitone = (semitoneOf(root) + interval) % 12
              const note = noteName(semitone)
              return (
                <Badge key={i} variant="outline" className="gap-1.5 px-2.5 py-1">
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                  {note}
                </Badge>
              )
            })}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Fretboard</h4>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" role="img">
            {/* Fret lines */}
            {Array.from({ length: FRET_COUNT + 1 }, (_, fi) => {
              const x = paddingLeft + fi * fretSpacing
              return (
                <line
                  key={fi}
                  x1={x} y1={0} x2={x} y2={svgHeight}
                  className={fi === 0 ? "stroke-foreground/40" : "stroke-foreground/15"}
                  strokeWidth={fi === 0 ? 2 : 0.8}
                />
              )
            })}

            {/* Fret numbers */}
            {Array.from({ length: FRET_COUNT }, (_, fi) => (
              <text
                key={`fn-${fi}`}
                x={paddingLeft + (fi + 1) * fretSpacing}
                y={svgHeight - 2}
                textAnchor="middle"
                className="fill-muted-foreground text-[7px]"
              >
                {fi + 1}
              </text>
            ))}

            {/* Strings and dots */}
            {STRING_LABELS.map((label, si) => {
              const y = 8 + si * stringSpacing
              const openNote = STRING_OPEN[si]
              return (
                <g key={si}>
                  <text x={2} y={y + 1} className="fill-muted-foreground text-[9px] font-medium">
                    {label}
                  </text>
                  <line x1={paddingLeft} y1={y} x2={paddingLeft + FRET_COUNT * fretSpacing} y2={y} className="stroke-foreground/20" strokeWidth={0.6} />
                  {Array.from({ length: FRET_COUNT + 1 }, (_, fi) => {
                    const noteSemi = (openNote + fi) % 12
                    if (!scaleNoteSet.has(noteSemi)) return null
                    return (
                      <circle
                        key={fi}
                        cx={paddingLeft + fi * fretSpacing}
                        cy={y}
                        r={5.5}
                        className="fill-primary"
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Diatonic Chords</h4>
          <div className="flex flex-wrap gap-1.5">
            {chords.map((chord, i) => (
              <Badge key={i} variant="outline" className="gap-1.5 px-2.5 py-1">
                <span className="text-xs text-muted-foreground">{chord.romanNumeral}</span>
                {formatChord(chord.root, chord.quality)}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
