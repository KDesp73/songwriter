"use client"

import { useState } from "react"
import { NOTES, getDiatonicChords, formatChord, QUALITY_GROUPS, chordBadgeColor } from "@/lib/chords"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ChordPaletteProps {
  root: string
  scale: "major" | "minor"
  onAddChord: (chord: { root: string; quality: string }) => void
}

export default function ChordPalette({ root, scale, onAddChord }: ChordPaletteProps) {
  const [customRoot, setCustomRoot] = useState(root)
  const [customQuality, setCustomQuality] = useState("")
  const diatonic = getDiatonicChords(root, scale)

  return (
    <div className="flex flex-col gap-4">
      {/* Diatonic quick-add */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Diatonic — {root} {scale}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {diatonic.map((chord, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => onAddChord({ root: chord.root, quality: chord.quality })}
              className={`h-8 gap-1.5 border px-2.5 text-sm font-semibold ${chordBadgeColor(chord.quality)}`}
            >
              <span className="text-xs font-normal opacity-60">{chord.romanNumeral}</span>
              {formatChord(chord.root, chord.quality)}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom chord builder */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Custom</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={customRoot} onValueChange={(v) => v && setCustomRoot(v)}>
            <SelectTrigger className="h-9 w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTES.map((note) => (
                <SelectItem key={note} value={note}>{note}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customQuality} onValueChange={(v) => v !== null && setCustomQuality(v)}>
            <SelectTrigger className="h-9 w-26">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              {QUALITY_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel className="text-xs text-muted-foreground">{group.label}</SelectLabel>
                  {group.qualities.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q || "Major"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => onAddChord({ root: customRoot, quality: customQuality })}
            className="h-9"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
