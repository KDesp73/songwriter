import { type Song } from "./types"

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
    return raw ? JSON.parse(raw) : null
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
    capoFret: 0,
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Verse",
        progression: [],
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
