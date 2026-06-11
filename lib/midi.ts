import { type Song } from "./types"
import { getChordNotes, type QualityKey } from "./chords"

function writeU16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff]
}

function writeU32(n: number): number[] {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function writeVarLen(n: number): number[] {
  const bytes: number[] = []
  let v = n
  bytes.push(v & 0x7f)
  while ((v >>= 7) > 0) {
    bytes.unshift((v & 0x7f) | 0x80)
  }
  return bytes
}

function deltaTime(ticks: number): number[] {
  return writeVarLen(ticks)
}

const TICKS_PER_BEAT = 480
const BASE_MIDI = 60

export function generateMidi(song: Song): Uint8Array {
  const events: number[] = []

  function push(...bytes: number[]) {
    events.push(...bytes)
  }

  function metaEvent(delta: number, type: number, data: number[]) {
    push(...deltaTime(delta), 0xff, type, ...writeVarLen(data.length), ...data)
  }

  function noteOn(delta: number, note: number, velocity: number) {
    push(...deltaTime(delta), 0x90, note, velocity)
  }

  function noteOff(delta: number, note: number) {
    push(...deltaTime(delta), 0x80, note, 0)
  }

  // tempo: microseconds per quarter note
  const usPerQ = Math.round(60000000 / song.tempo)
  metaEvent(0, 0x51, [usPerQ >> 16, (usPerQ >> 8) & 0xff, usPerQ & 0xff])

  // time signature: numerator, denominator (power of 2), clocks per tick, 32nd notes per quarter
  const denomLog2 = Math.log2(song.timeSignature.noteValue)
  metaEvent(0, 0x58, [song.timeSignature.beats, denomLog2, 24, 8])

  // track name
  const nameBytes = [...new TextEncoder().encode(song.title)]
  metaEvent(0, 0x03, nameBytes)

  // set instrument (acoustic grand piano)
  push(...deltaTime(0), 0xc0, 0)

  const beatTicks = TICKS_PER_BEAT

  for (const section of song.sections) {
    if (section.progression.length === 0) continue

    for (const slot of section.progression) {
      const intervals = getChordNotes(slot.chord.root, slot.chord.quality as QualityKey)
      const durTicks = slot.beats * beatTicks

      const notes = intervals.map((interval) => BASE_MIDI + interval)

      // arpeggiated chord — stagger each note by 1 tick
      notes.forEach((note, i) => {
        noteOn(i, note, 80)
      })
      notes.forEach((note, i) => {
        noteOff(durTicks - (notes.length - 1 - i), note)
      })
    }
  }

  // end of track
  push(...deltaTime(0), 0xff, 0x2f, 0x00)

  const trackData = events
  const trackLen = trackData.length
  const header = [
    ...new TextEncoder().encode("MThd"),
    ...writeU32(6),
    ...writeU16(0),
    ...writeU16(1),
    ...writeU16(TICKS_PER_BEAT),
  ]
  const trackChunk = [
    ...new TextEncoder().encode("MTrk"),
    ...writeU32(trackLen),
    ...trackData,
  ]

  return new Uint8Array([...header, ...trackChunk])
}

export function downloadMidi(song: Song) {
  const data = generateMidi(song)
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  const blob = new Blob([buffer], { type: "audio/midi" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${song.title.replace(/[^a-zA-Z0-9]/g, "_")}.mid`
  a.click()
  URL.revokeObjectURL(url)
}
