export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, "C#": 1, Db: 1,
  D: 2, "D#": 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10,
  B: 11, Cb: 11,
}

export const SEMITONE_TO_NOTE = (() => {
  const map: Record<number, string> = {}
  for (const [note, semitone] of Object.entries(NOTE_TO_SEMITONE)) {
    if (!(semitone in map)) {
      map[semitone] = note
    }
  }
  return map
})()

export function semitoneOf(root: string): number {
  return NOTE_TO_SEMITONE[root] ?? 0
}

export function noteName(semitone: number): string {
  return SEMITONE_TO_NOTE[((semitone % 12) + 12) % 12] ?? "?"
}

export const CHORD_QUALITIES: Record<string, { intervals: number[]; label: string }> = {
  "":    { intervals: [0, 4, 7],    label: "" },
  "m":   { intervals: [0, 3, 7],    label: "m" },
  "dim": { intervals: [0, 3, 6],    label: "dim" },
  "aug": { intervals: [0, 4, 8],    label: "aug" },
  "7":   { intervals: [0, 4, 7, 10], label: "7" },
  "maj7":{ intervals: [0, 4, 7, 11], label: "maj7" },
  "m7":  { intervals: [0, 3, 7, 10], label: "m7" },
  "dim7":{ intervals: [0, 3, 6, 9],  label: "dim7" },
  "m7b5":{ intervals: [0, 3, 6, 10], label: "m7b5" },
  "sus2":{ intervals: [0, 2, 7],    label: "sus2" },
  "sus4":{ intervals: [0, 5, 7],    label: "sus4" },
  "6":   { intervals: [0, 4, 7, 9],  label: "6" },
  "m6":  { intervals: [0, 3, 7, 9],  label: "m6" },
  "9":   { intervals: [0, 4, 7, 10, 14], label: "9" },
  "add9":{ intervals: [0, 4, 7, 14], label: "add9" },
}

export type QualityKey = keyof typeof CHORD_QUALITIES

export const ALL_QUALITIES: QualityKey[] = ["", "m", "dim", "aug", "7", "maj7", "m7", "dim7", "m7b5", "6", "m6", "9", "add9", "sus2", "sus4"]

export const QUALITY_GROUPS: { label: string; qualities: QualityKey[] }[] = [
  { label: "Triads", qualities: ["", "m", "dim", "aug"] },
  { label: "Sevenths", qualities: ["7", "maj7", "m7", "dim7", "m7b5"] },
  { label: "Sixths", qualities: ["6", "m6"] },
  { label: "Ninths", qualities: ["9", "add9"] },
  { label: "Sus", qualities: ["sus2", "sus4"] },
]

const QUALITY_COLORS: Record<string, string> = {
  "":     "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "m":    "bg-green-500/15 text-green-400 border-green-500/25",
  "dim":  "bg-rose-500/15 text-rose-400 border-rose-500/25",
  "dim7": "bg-rose-500/15 text-rose-400 border-rose-500/25",
  "aug":  "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "7":    "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "maj7": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "m7":   "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "m7b5": "bg-rose-500/15 text-rose-400 border-rose-500/25",
  "sus2": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  "sus4": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  "6":    "bg-teal-500/15 text-teal-400 border-teal-500/25",
  "m6":   "bg-teal-500/15 text-teal-400 border-teal-500/25",
  "9":    "bg-pink-500/15 text-pink-400 border-pink-500/25",
  "add9": "bg-pink-500/15 text-pink-400 border-pink-500/25",
}

export function chordBadgeColor(quality: string): string {
  return QUALITY_COLORS[quality] ?? "bg-foreground/10 text-foreground border-foreground/20"
}

export const SCALE_PATTERNS: Record<string, number[]> = {
  major:       [0, 2, 4, 5, 7, 9, 11],
  "natural minor": [0, 2, 3, 5, 7, 8, 10],
  harmonic:    [0, 2, 3, 5, 7, 8, 11],
  melodic:     [0, 2, 3, 5, 7, 9, 11],
  dorian:      [0, 2, 3, 5, 7, 9, 10],
  phrygian:    [0, 1, 3, 5, 7, 8, 10],
  lydian:      [0, 2, 4, 6, 7, 9, 11],
  mixolydian:  [0, 2, 4, 5, 7, 9, 10],
  locrian:     [0, 1, 3, 5, 6, 8, 10],
}

export interface DiatonicChord {
  root: string
  quality: string
  scaleDegree: number
  romanNumeral: string
}

const ROMAN_MAJOR = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
const ROMAN_MINOR = ["i", "ii°", "III", "iv", "v", "VI", "VII"]

const DIATONIC_QUALITIES_MAJOR = ["", "m", "m", "", "", "m", "dim"]
const DIATONIC_QUALITIES_MINOR = ["m", "dim", "", "m", "m", "", ""]

export function getScaleNotes(root: string, pattern: string): number[] {
  const rootSemitone = semitoneOf(root)
  const intervals = SCALE_PATTERNS[pattern] ?? SCALE_PATTERNS.major
  return intervals.map((i) => (rootSemitone + i) % 12)
}

export function getDiatonicChords(root: string, scale: "major" | "minor"): DiatonicChord[] {
  const pattern = scale === "major" ? "major" : "natural minor"
  const scaleNotes = getScaleNotes(root, pattern)
  const romanNumerals = scale === "major" ? ROMAN_MAJOR : ROMAN_MINOR
  const qualities = scale === "major" ? DIATONIC_QUALITIES_MAJOR : DIATONIC_QUALITIES_MINOR

  return scaleNotes.map((note, i) => ({
    root: noteName(note),
    quality: qualities[i],
    scaleDegree: i + 1,
    romanNumeral: romanNumerals[i],
  }))
}

export function formatChord(root: string, quality: string): string {
  if (!quality) return root
  return `${root}${quality}`
}

export function getChordNotes(root: string, quality: QualityKey): number[] {
  const rootSemitone = semitoneOf(root)
  const intervals = CHORD_QUALITIES[quality]?.intervals ?? CHORD_QUALITIES[""].intervals
  return intervals.map((i) => rootSemitone + i)
}

export function transposeNote(note: string, semitones: number): string {
  const semitone = NOTE_TO_SEMITONE[note]
  if (semitone === undefined) return note
  const newSemitone = ((semitone + semitones) % 12 + 12) % 12
  return noteName(newSemitone)
}

export function transposeChord(chord: { root: string; quality: string }, semitones: number): { root: string; quality: string } {
  return {
    root: transposeNote(chord.root, semitones),
    quality: chord.quality,
  }
}

const FUNCTION_LABELS: Record<string, { major: string; minor: string }> = {
  "I":    { major: "Tonic", minor: "Tonic" },
  "ii":   { major: "Supertonic", minor: "" },
  "iii":  { major: "Mediant", minor: "" },
  "IV":   { major: "Subdominant", minor: "" },
  "V":    { major: "Dominant", minor: "Dominant" },
  "vi":   { major: "Submediant", minor: "" },
  "vii°": { major: "Leading Tone", minor: "" },
  "i":    { major: "", minor: "Tonic" },
  "ii°":  { major: "", minor: "Supertonic" },
  "III":  { major: "", minor: "Mediant" },
  "iv":   { major: "", minor: "Subdominant" },
  "v":    { major: "", minor: "Dominant" },
  "VI":   { major: "", minor: "Submediant" },
  "VII":  { major: "", minor: "Subtonic" },
}

export interface ChordAnalysis {
  romanNumeral: string
  function: string
  isDiatonic: boolean
}

export function analyzeChord(
  chord: { root: string; quality: string },
  key: string,
  scale: "major" | "minor",
): ChordAnalysis {
  const diatonics = getDiatonicChords(key, scale)
  const match = diatonics.find(
    (d) => d.root === chord.root && d.quality === chord.quality,
  )
  if (match) {
    const fn = FUNCTION_LABELS[match.romanNumeral]
    return {
      romanNumeral: match.romanNumeral,
      function: fn ? fn[scale] : "",
      isDiatonic: true,
    }
  }
  const rootMatch = diatonics.find((d) => d.root === chord.root)
  if (rootMatch) {
    const fn = FUNCTION_LABELS[rootMatch.romanNumeral]
    return {
      romanNumeral: rootMatch.romanNumeral,
      function: fn ? fn[scale] : "",
      isDiatonic: false,
    }
  }
  return { romanNumeral: "?", function: "Chromatic", isDiatonic: false }
}

export function capoInfo(chord: { root: string; quality: string }, capoFret: number): {
  shape: string
  actual: string
} {
  const actual: { root: string; quality: string } = {
    root: transposeNote(chord.root, capoFret),
    quality: chord.quality,
  }
  return {
    shape: formatChord(chord.root, chord.quality),
    actual: formatChord(actual.root, actual.quality),
  }
}

export function getRelativeKey(root: string, scale: "major" | "minor"): { root: string; scale: "major" | "minor" } {
  if (scale === "major") {
    return { root: noteName(semitoneOf(root) - 3), scale: "minor" }
  }
  return { root: noteName(semitoneOf(root) + 3), scale: "major" }
}

export function getModalInterchangeChords(root: string, scale: "major" | "minor"): DiatonicChord[] {
  if (scale === "minor") return []
  const parallelMinor = getDiatonicChords(root, "minor")
  const diatonic = getDiatonicChords(root, "major")
  return parallelMinor.filter(
    (pc) => !diatonic.some((dc) => dc.root === pc.root && dc.quality === pc.quality),
  )
}

export interface ChordRecommendation {
  chord: { root: string; quality: string }
  label: string
}

const NEXT_CHORDS: Record<string, { roman: string; label: string }[]> = {
  "I":    [{ roman: "ii", label: "Supertonic" }, { roman: "iii", label: "Mediant" }, { roman: "IV", label: "Subdominant" }, { roman: "V", label: "Dominant" }, { roman: "vi", label: "Submediant" }],
  "ii":   [{ roman: "V", label: "Dominant (strong)" }, { roman: "vii°", label: "Leading Tone" }, { roman: "IV", label: "Subdominant" }],
  "iii":  [{ roman: "vi", label: "Submediant (natural)" }, { roman: "IV", label: "Subdominant" }],
  "IV":   [{ roman: "V", label: "Dominant (strong)" }, { roman: "I", label: "Tonic" }, { roman: "ii", label: "Supertonic" }, { roman: "vii°", label: "Leading Tone" }],
  "V":    [{ roman: "I", label: "Tonic (resolution)" }, { roman: "vi", label: "Deceptive cadence" }],
  "vi":   [{ roman: "ii", label: "Supertonic" }, { roman: "V", label: "Dominant" }, { roman: "IV", label: "Subdominant" }, { roman: "I", label: "Tonic" }],
  "vii°": [{ roman: "I", label: "Tonic (resolution)" }],
  "i":    [{ roman: "iv", label: "Subdominant" }, { roman: "V", label: "Dominant" }, { roman: "VII", label: "Subtonic" }, { roman: "VI", label: "Submediant" }],
  "ii°":  [{ roman: "V", label: "Dominant" }, { roman: "i", label: "Tonic" }],
  "III":  [{ roman: "VI", label: "Submediant" }, { roman: "iv", label: "Subdominant" }, { roman: "VII", label: "Subtonic" }, { roman: "i", label: "Tonic" }],
  "iv":   [{ roman: "V", label: "Dominant (strong)" }, { roman: "i", label: "Tonic" }, { roman: "VII", label: "Subtonic" }],
  "v":    [{ roman: "i", label: "Tonic" }, { roman: "VI", label: "Submediant" }, { roman: "VII", label: "Subtonic" }],
  "VI":   [{ roman: "III", label: "Mediant" }, { roman: "iv", label: "Subdominant" }, { roman: "i", label: "Tonic" }, { roman: "VII", label: "Subtonic" }],
  "VII":  [{ roman: "i", label: "Tonic" }, { roman: "III", label: "Mediant" }],
}

export interface ProgressionGrade {
  grade: string
  label: string
  details: string[]
}

export function gradeProgression(
  progression: { chord: { root: string; quality: string } }[],
  key: string,
  scale: "major" | "minor",
): ProgressionGrade {
  const details: string[] = []

  if (progression.length === 0) {
    return { grade: "—", label: "Empty", details: [] }
  }
  if (progression.length === 1) {
    return { grade: "C", label: "Needs more chords", details: ["Only one chord"] }
  }

  let score = 0
  let total = 0

  const first = analyzeChord(progression[0].chord, key, scale)
  if (first.romanNumeral === "I" || first.romanNumeral === "i") {
    score += 1; details.push("Opens on tonic")
  }
  total += 1

  for (let i = 0; i < progression.length - 1; i++) {
    const from = progression[i].chord
    const to = progression[i + 1].chord
    const fa = analyzeChord(from, key, scale)
    const ta = analyzeChord(to, key, scale)

    if (!fa.isDiatonic) {
      score -= 1; details.push(`Non-diatonic: ${formatChord(from.root, from.quality)}`)
    }

    const f = fa.romanNumeral
    const t = ta.romanNumeral

    if ((f === "V" || f === "v") && (t === "I" || t === "i")) {
      score += 2; details.push("Authentic cadence (V→I)");
    } else if ((f === "ii" || f === "ii°") && (t === "V" || t === "v")) {
      score += 1; details.push("ii→V setup");
    } else if ((f === "IV" || f === "iv") && (t === "I" || t === "i")) {
      score += 1; details.push("Plagal cadence (IV→I)");
    } else if ((f === "V" || f === "v") && (t === "vi" || t === "VI")) {
      score += 1; details.push("Deceptive cadence (V→vi)");
    } else {
      const diff = ((semitoneOf(to.root) - semitoneOf(from.root)) % 12 + 12) % 12
      if (diff === 5 || diff === 7) {
        score += 1; details.push("Circle of fifths");
      } else if (fa.isDiatonic && ta.isDiatonic) {
        details.push("Functional transition");
      }
    }
    total += 2
  }

  const last = analyzeChord(progression[progression.length - 1].chord, key, scale)
  if ((last.romanNumeral === "I" || last.romanNumeral === "i") && progression.length > 1) {
    score += 1; details.push("Resolves to tonic")
  }
  total += 1

  const pct = total > 0 ? score / total : 0
  let grade: string, label: string
  if (pct >= 0.7) { grade = "A"; label = "Strong" }
  else if (pct >= 0.5) { grade = "B"; label = "Solid" }
  else if (pct >= 0.3) { grade = "C"; label = "Decent" }
  else if (pct >= 0.1) { grade = "D"; label = "Weak" }
  else { grade = "F"; label = "Unconventional" }

  return { grade, label, details }
}

export function getChordRecommendations(
  chord: { root: string; quality: string },
  key: string,
  scale: "major" | "minor",
): ChordRecommendation[] {
  const analysis = analyzeChord(chord, key, scale)
  if (!analysis.isDiatonic) return []

  const nextEntries = NEXT_CHORDS[analysis.romanNumeral]
  if (!nextEntries) return []

  const diatonics = getDiatonicChords(key, scale)
  const romanToDiatonic: Record<string, DiatonicChord> = {}
  for (const dc of diatonics) {
    romanToDiatonic[dc.romanNumeral] = dc
  }

  return nextEntries
    .map((entry) => {
      const dc = romanToDiatonic[entry.roman]
      if (!dc) return null
      return {
        chord: { root: dc.root, quality: dc.quality },
        label: entry.label,
      }
    })
    .filter((r): r is ChordRecommendation => r !== null)
}
