export type FretVal = number | "x"

export interface ChordShape {
  name: string
  frets: [FretVal, FretVal, FretVal, FretVal, FretVal, FretVal]
  fingers?: [number | null, number | null, number | null, number | null, number | null, number | null]
  barre?: { fret: number; from: number; to: number }
}

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
  return SHAPES.find((s) => s.name === fullName)
}

export function getAllShapes(): ChordShape[] {
  return SHAPES
}
