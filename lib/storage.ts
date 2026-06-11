import { type Song, DEFAULT_TIME_SIGNATURE } from "./types"

const SONGS_INDEX = "songwriter:songs"
const SONG_PREFIX = "songwriter:song:"

interface SongMeta {
  id: string
  title: string
  updatedAt: number
}

function readIndex(): SongMeta[] {
  try {
    const raw = localStorage.getItem(SONGS_INDEX)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeIndex(index: SongMeta[]) {
  localStorage.setItem(SONGS_INDEX, JSON.stringify(index))
}

export function listSongs(): SongMeta[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function saveSong(song: Song) {
  const songData = { ...song, updatedAt: Date.now() }
  localStorage.setItem(SONG_PREFIX + song.id, JSON.stringify(songData))

  const index = readIndex()
  const existing = index.findIndex((m) => m.id === song.id)
  const meta: SongMeta = { id: song.id, title: song.title, updatedAt: songData.updatedAt }
  if (existing >= 0) {
    index[existing] = meta
  } else {
    index.push(meta)
  }
  writeIndex(index)
}

export function loadSong(id: string): Song | null {
  try {
    const raw = localStorage.getItem(SONG_PREFIX + id)
    if (!raw) return null
    const song: Song = JSON.parse(raw)
    for (const section of song.sections) {
      if (!section.lyrics) section.lyrics = ""
    }
    if (!song.waveform) song.waveform = "triangle"
    if (!song.timeSignature) song.timeSignature = { ...DEFAULT_TIME_SIGNATURE }
    return song
  } catch {
    return null
  }
}

export function deleteSong(id: string) {
  localStorage.removeItem(SONG_PREFIX + id)
  const index = readIndex().filter((m) => m.id !== id)
  writeIndex(index)
}

export function createNewSong(title?: string): Song {
  return {
    id: crypto.randomUUID(),
    title: title ?? "Untitled Song",
    key: "C",
    scale: "major",
    tempo: 120,
    timeSignature: { ...DEFAULT_TIME_SIGNATURE },
    capoFret: 0,
    waveform: "triangle",
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Verse",
        progression: [],
        lyrics: "",
        tab: `e|------------------------------------------------------------------|
B|------------------------------------------------------------------|
G|------------------------------------------------------------------|
D|------------------------------------------------------------------|
A|------------------------------------------------------------------|
E|------------------------------------------------------------------|`,
      },
      {
        id: crypto.randomUUID(),
        name: "Chorus",
        progression: [],
        lyrics: "",
        tab: `e|------------------------------------------------------------------|
B|------------------------------------------------------------------|
G|------------------------------------------------------------------|
D|------------------------------------------------------------------|
A|------------------------------------------------------------------|
E|------------------------------------------------------------------|`,
      },
    ],
    updatedAt: Date.now(),
  }
}

export function exportCollection(): string {
  const index = readIndex()
  const songs: Song[] = []
  for (const meta of index) {
    const song = loadSong(meta.id)
    if (song) songs.push(song)
  }
  return JSON.stringify({ version: 1, exportedAt: Date.now(), songs }, null, 2)
}

export function importCollection(json: string): { imported: number; errors: string[] } {
  const errors: string[] = []
  let imported = 0
  try {
    const data = JSON.parse(json)
    if (!data.songs || !Array.isArray(data.songs)) {
      return { imported: 0, errors: ["Invalid format: missing 'songs' array"] }
    }
    for (const song of data.songs) {
      if (!song.id || !song.title || !song.sections) {
        errors.push(`Skipped entry: missing id/title/sections`)
        continue
      }
      for (const section of song.sections) {
        if (!section.lyrics) section.lyrics = ""
      }
      if (!song.waveform) song.waveform = "triangle"
      if (!song.timeSignature) song.timeSignature = { ...DEFAULT_TIME_SIGNATURE }
      saveSong(song as Song)
      imported++
    }
    return { imported, errors }
  } catch (e) {
    return { imported: 0, errors: [`Parse error: ${e instanceof Error ? e.message : "unknown"}`] }
  }
}
