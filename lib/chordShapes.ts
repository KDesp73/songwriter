export type FretVal = number | "x"

export interface ChordShape {
  name: string
  frets: [FretVal, FretVal, FretVal, FretVal, FretVal, FretVal]
  fingers?: [number | null, number | null, number | null, number | null, number | null, number | null]
  barre?: { fret: number; from: number; to: number }
}

import { semitoneOf, CHORD_QUALITIES } from "./chords"

const SHAPES: ChordShape[] = [
  { name: "C",  frets: ["x", 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: "D",  frets: ["x", "x", 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { name: "Dm", frets: ["x", "x", 0, 2, 3, 1], fingers: [null, null, null, 1, 3, 2] },
  { name: "E",  frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { name: "F",  frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  { name: "G",  frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { name: "A",  frets: ["x", 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: "Am", frets: ["x", 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { name: "B",  frets: ["x", 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1], barre: { fret: 2, from: 0, to: 5 } },
  { name: "Bm", frets: ["x", 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], barre: { fret: 2, from: 0, to: 4 } },
  { name: "C7", frets: ["x", 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { name: "D7", frets: ["x", "x", 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { name: "A7", frets: ["x", 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { name: "Am7",frets: ["x", 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null] },
  { name: "Dm7",frets: ["x", "x", 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 3] },
  { name: "Em7",frets: [0, 2, 0, 0, 0, 0], fingers: [null, 2, null, null, null, null] },
  { name: "Cmaj7", frets: ["x", 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  { name: "Fmaj7", frets: ["x", "x", 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null] },
  { name: "Dsus2", frets: ["x", "x", 0, 2, 3, 0], fingers: [null, null, null, 1, 2, null] },
  { name: "Dsus4", frets: ["x", "x", 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },
  { name: "Asus2", frets: ["x", 0, 2, 2, 0, 0], fingers: [null, null, 2, 3, null, null] },
  { name: "Asus4", frets: ["x", 0, 2, 2, 3, 0], fingers: [null, null, 2, 3, 4, null] },
  { name: "Esus4", frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null] },
  { name: "Dmaj7", frets: ["x", "x", 0, 2, 2, 2], fingers: [null, null, null, 1, 2, 3] },
  { name: "Gm", frets: [3, 2, 3, 0, "x", "x"], fingers: [2, 1, 3, null, null, null] },
  { name: "Cm", frets: ["x", 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], barre: { fret: 3, from: 0, to: 5 } },
  { name: "Fm", frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
]

export function findShape(root: string, quality: string): ChordShape | undefined {
  const fullName = quality ? `${root}${quality}` : root
  return SHAPES.find((s) => s.name === fullName) ?? generateShape(root, quality)
}

const OPEN_NOTES = [40, 45, 50, 55, 59, 64]

function generateShape(root: string, quality: string): ChordShape | undefined {
  const chordSemitones = chordSemitonesOf(root, quality)
  if (!chordSemitones || chordSemitones.length < 2) return undefined

  const chordSet = new Set(chordSemitones)
  const maxFret = 12
  let best: (number | "x")[] = []
  let bestSpan = Infinity
  let bestMinFret = Infinity

  const openNoteSemitones = OPEN_NOTES.map((n) => n % 12)

  function enumerate(pos: number, current: (number | "x")[], minFret: number, maxFretIn: number) {
    if (pos === 6) {
      const span = maxFretIn - minFret
      if (span < bestSpan || (span === bestSpan && minFret < bestMinFret)) {
        best = [...current]
        bestSpan = span
        bestMinFret = minFret
      }
      return
    }

    const mutedOk = pos > 1

    for (let f = 0; f <= maxFret; f++) {
      const noteSemitone = (openNoteSemitones[pos] + f) % 12
      if (chordSet.has(noteSemitone)) {
        current[pos] = f
        const newMin = f > 0 ? (minFret === 0 ? f : Math.min(minFret, f)) : minFret
        const newMax = Math.max(maxFretIn, f)
        if (newMax - newMin <= bestSpan) {
          enumerate(pos + 1, current, newMin, newMax)
        }
      }
    }

    if (mutedOk) {
      current[pos] = "x"
      enumerate(pos + 1, current, minFret, maxFretIn)
    }
  }

  enumerate(0, [], 0, 0)

  if (best.length !== 6 || best.every((f) => f === "x")) return undefined

  const frets = best as unknown as [FretVal, FretVal, FretVal, FretVal, FretVal, FretVal]
  const playedFrets = frets.filter((f): f is number => f !== "x")
  const minFretVal = Math.min(...playedFrets)
  const hasOpen = playedFrets.includes(0)

  const fingers: (number | null)[] = frets.map((f) => {
    if (f === "x") return null
    if (f === 0) return null
    if (hasOpen && minFretVal === 0) return null
    const relative = f - minFretVal
    if (relative === 0) return 1
    if (relative === 1) return 2
    if (relative === 2) return 3
    if (relative === 3) return 4
    return 4
  }) as (number | null)[]

  let barre: { fret: number; from: number; to: number } | undefined
  if (!hasOpen && playedFrets.length >= 3) {
    const firstFingered = frets.findIndex((f) => typeof f === "number" && f > 0)
    let lastFingered = -1
    for (let i = frets.length - 1; i >= 0; i--) {
      const f = frets[i]
      if (typeof f === "number" && f > 0) { lastFingered = i; break }
    }
    const allSameFret = playedFrets.every((f) => f === minFretVal)
    if (allSameFret && minFretVal > 0) {
      barre = { fret: minFretVal, from: firstFingered, to: lastFingered }
    }
  }

  return { name: `${root}${quality}`, frets, fingers: fingers as [number | null, number | null, number | null, number | null, number | null, number | null], barre }
}

function chordSemitonesOf(root: string, quality: string): number[] | undefined {
  const rootSemitone = semitoneOf(root)
  const intervals = CHORD_QUALITIES[quality]?.intervals
  if (!intervals) return undefined
  return intervals.map((i) => (rootSemitone + i) % 12)
}

export function getAllShapes(): ChordShape[] {
  return SHAPES
}
