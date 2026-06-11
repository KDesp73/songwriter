export interface ChordDef {
  root: string
  quality: string
}

export interface ProgressionSlot {
  chord: ChordDef
  beats: number
}

export interface Section {
  id: string
  name: string
  progression: ProgressionSlot[]
  tab: string
  lyrics: string
}

export type WaveformType = "triangle" | "sine" | "square" | "sawtooth"

export interface Song {
  id: string
  title: string
  key: string
  scale: "major" | "minor"
  tempo: number
  timeSignature: { beats: number; noteValue: number }
  capoFret: number
  waveform: WaveformType
  sections: Section[]
  updatedAt: number
}

export const DEFAULT_TIME_SIGNATURE = { beats: 4, noteValue: 4 } as const

export const TAB_TEMPLATE = `e|------------------------------------------------------------------|
B|------------------------------------------------------------------|
G|------------------------------------------------------------------|
D|------------------------------------------------------------------|
A|------------------------------------------------------------------|
E|------------------------------------------------------------------|`

export interface NoteEvent {
  note: number
  startTime: number
  duration: number
  gain: number
}
