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
}

export interface Song {
  id: string
  title: string
  key: string
  scale: "major" | "minor"
  tempo: number
  capoFret: number
  sections: Section[]
}

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
