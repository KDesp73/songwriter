"use client"

import { useState } from "react"
import { NOTES, getDiatonicChords, formatChord, QUALITY_GROUPS, CHORD_QUALITIES } from "@/lib/chords"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <Card>
      <CardHeader>
        <CardTitle>Chords</CardTitle>
        <CardDescription>
          Click a diatonic chord or build a custom one
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Diatonic quick-add */}
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            Diatonic — {root} {scale}
          </h4>
          <div className="flex flex-wrap gap-2">
            {diatonic.map((chord, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => onAddChord({ root: chord.root, quality: chord.quality })}
                className="gap-1.5"
              >
                <span className="text-xs text-muted-foreground">{chord.romanNumeral}</span>
                {formatChord(chord.root, chord.quality)}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom chord builder */}
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Custom</h4>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={customRoot} onValueChange={(v) => v && setCustomRoot(v)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTES.map((note) => (
                  <SelectItem key={note} value={note}>{note}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={customQuality} onValueChange={(v) => v !== null && setCustomQuality(v)}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
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
            >
              Add {formatChord(customRoot, customQuality)}
            </Button>

            {customQuality && (
              <span className="text-xs text-muted-foreground">
                {CHORD_QUALITIES[customQuality]?.intervals.length ?? 0} notes
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
