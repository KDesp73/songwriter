"use client"

import { getDiatonicChords, formatChord, type DiatonicChord } from "@/lib/chords"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChordPaletteProps {
  root: string
  scale: "major" | "minor"
  onAddChord: (chord: DiatonicChord) => void
}

export default function ChordPalette({ root, scale, onAddChord }: ChordPaletteProps) {
  const chords = getDiatonicChords(root, scale)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diatonic Chords</CardTitle>
        <CardDescription>
          {root} {scale} — click to add to active section
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {chords.map((chord, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={() => onAddChord(chord)}
              className="gap-2"
            >
              <Badge variant="secondary" className="-ml-0.5">
                {chord.romanNumeral}
              </Badge>
              {formatChord(chord.root, chord.quality)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
