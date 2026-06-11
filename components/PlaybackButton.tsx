"use client"

import { useState, useRef, useCallback } from "react"
import { type ProgressionSlot } from "@/lib/types"
import { AudioEngine } from "@/lib/audio"
import { Button } from "@/components/ui/button"

interface PlaybackButtonProps {
  progression: ProgressionSlot[]
  bpm: number
  metronome?: boolean
  onChordChange?: (index: number | null) => void
}

export default function PlaybackButton({ progression, bpm, metronome, onChordChange }: PlaybackButtonProps) {
  const [playing, setPlaying] = useState(false)
  const engineRef = useRef<AudioEngine | null>(null)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine()
    }
    return engineRef.current
  }, [])

  async function togglePlay() {
    if (playing) {
      getEngine().stop()
      setPlaying(false)
      onChordChange?.(null)
      return
    }

    if (progression.length === 0) return

    setPlaying(true)
    try {
      await getEngine().playProgression(progression, bpm, (i) => {
        onChordChange?.(i)
        if (i === null) setPlaying(false)
      }, metronome)
    } finally {
      setPlaying(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.stopPropagation()
        togglePlay()
      }}
      aria-label={playing ? "Stop" : "Play"}
      className={playing ? "text-primary" : "text-muted-foreground"}
    >
      {playing ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="3" y="2" width="3" height="10" rx="0.5" />
          <rect x="8" y="2" width="3" height="10" rx="0.5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M4 2L12 7L4 12V2Z" />
        </svg>
      )}
    </Button>
  )
}
