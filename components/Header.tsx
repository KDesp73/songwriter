"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ScaleExplorer from "./ScaleExplorer"

interface HeaderProps {
  metronome: boolean
  onMetronomeChange: (on: boolean) => void
  waveform: "triangle" | "sine" | "square" | "sawtooth"
  onWaveformChange: (w: "triangle" | "sine" | "square" | "sawtooth") => void
  onExport: () => void
  onExportMidi: () => void
}

export default function Header({ metronome, onMetronomeChange, waveform, onWaveformChange, onExport, onExportMidi }: HeaderProps) {
  const [showScales, setShowScales] = useState(false)

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-sidebar px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
              S
            </span>
            <h1 className="text-lg font-bold tracking-tight">Songwriter</h1>
          </div>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Chord Progression Builder
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMetronomeChange(!metronome)}
            className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
              metronome
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Toggle metronome"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="8" width="2" height="5" rx="0.5" fill="currentColor" />
              <rect x="6" y="5" width="2" height="8" rx="0.5" fill="currentColor" />
              <rect x="10" y="2" width="2" height="11" rx="0.5" fill="currentColor" />
            </svg>
            Click
          </button>
          <select
            value={waveform}
            onChange={(e) => onWaveformChange(e.target.value as "triangle" | "sine" | "square" | "sawtooth")}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Waveform"
          >
            <option value="triangle">Triangle</option>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
          <button
            onClick={onExport}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Download PDF"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V9M7 9L4.5 6.5M7 9L9.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 9V11.5C2 12.05 2.45 12.5 3 12.5H11C11.55 12.5 12 12.05 12 11.5V9" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            PDF
          </button>
          <button
            onClick={onExportMidi}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Download MIDI"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M5 5V9M7 5V9M9 5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            MIDI
          </button>
          <Button variant="ghost" size="sm" onClick={() => setShowScales(true)} className="h-7 gap-1.5 rounded-lg text-xs">
            <span className="inline-block size-2 rounded-full bg-primary" />
            Scales
          </Button>
        </div>
      </header>
      <ScaleExplorer open={showScales} onOpenChange={setShowScales} />
    </>
  )
}
