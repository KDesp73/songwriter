"use client"

import { useState, useEffect, useRef } from "react"
import { type Song } from "@/lib/types"
import { loadSong, saveSong, createNewSong, listSongs, deleteSong } from "@/lib/storage"

interface UsePersistedSongResult {
  song: Song
  setSong: (song: Song) => void
  updateSong: (updater: (prev: Song) => Song) => void
  savedSongs: { id: string; title: string; updatedAt: number }[]
  switchSong: (id: string) => void
  newSong: () => void
  deleteCurrentSong: () => void
}

export function usePersistedSong(): UsePersistedSongResult {
  const [song, setSong] = useState<Song>(() => {
    const all = listSongs()
    if (all.length > 0) {
      return loadSong(all[0].id) ?? createNewSong()
    }
    return createNewSong()
  })

  const [savedSongs, setSavedSongs] = useState(() => listSongs())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveSong(song)
      setSavedSongs(listSongs())
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [song])

  function updateSong(updater: (prev: Song) => Song) {
    setSong((prev) => updater(prev))
  }

  function switchSong(id: string) {
    const loaded = loadSong(id)
    if (loaded) setSong(loaded)
  }

  function newSong() {
    const s = createNewSong()
    setSong(s)
  }

  function deleteCurrentSong() {
    const all = listSongs().filter((m) => m.id !== song.id)
    if (all.length === 0) {
      deleteSong(song.id)
      const s = createNewSong()
      setSong(s)
      setSavedSongs(listSongs())
      return
    }
    deleteSong(song.id)
    const next = loadSong(all[0].id) ?? createNewSong()
    setSong(next)
    setSavedSongs(listSongs())
  }

  return { song, setSong, updateSong, savedSongs, switchSong, newSong, deleteCurrentSong }
}
