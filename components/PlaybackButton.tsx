"use client"

import { useState, useCallback } from "react"
import { type ProgressionSlot } from "@/lib/types"
import { AudioEngine } from "@/lib/audio"
import { Button } from "@/components/ui/button"

interface PlaybackButtonProps {
  progression: ProgressionSlot[]
  bpm: number
  metronome?: boolean
  waveform?: "triangle" | "sine" | "square" | "sawtooth"
  onChordChange?: (index: number | null) => void
  beatsPerMeasure?: number
}

export default function PlaybackButton({ progression, bpm, metronome, waveform, onChordChange, beatsPerMeasure = 4 }: PlaybackButtonProps) {
  const [playing, setPlaying] = useState(false)
  const [looping, setLooping] = useState(false)

  const getEngine = useCallback(() => AudioEngine.getInstance(), [])

  async function togglePlay() {
    const engine = getEngine()
    if (playing) {
      engine.stop()
      setPlaying(false)
      onChordChange?.(null)
      return
    }

    if (progression.length === 0) return

    setPlaying(true)
    try {
      await engine.playProgression(progression, bpm, (i) => {
        onChordChange?.(i)
        if (i === null) setPlaying(false)
      }, metronome, waveform, beatsPerMeasure, looping)
    } finally {
      setPlaying(false)
    }
  }

  return (
    <div className="flex items-center gap-0.5">
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
      <button
        onClick={(e) => {
          e.stopPropagation()
          setLooping((v) => !v)
        }}
        aria-label={looping ? "Disable loop" : "Enable loop"}
        className={`flex size-5 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-foreground ${
          looping ? "!text-primary" : ""
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 7C1 4.5 3 2.5 5.5 2.5H8.5" />
          <path d="M7.5 1L9.5 2.5L7.5 4" />
          <path d="M13 7C13 9.5 11 11.5 8.5 11.5H5.5" />
          <path d="M6.5 13L4.5 11.5L6.5 10" />
        </svg>
      </button>
    </div>
  )
}
