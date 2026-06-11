"use client"

import { useState, useCallback } from "react"
import { type Song, type Section, type ProgressionSlot, TAB_TEMPLATE } from "@/lib/types"
import { type DiatonicChord, transposeChord, transposeNote } from "@/lib/chords"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import KeySelector from "./KeySelector"
import ChordPalette from "./ChordPalette"
import SectionBlock from "./SectionBlock"

function createSection(name: string): Section {
  return {
    id: crypto.randomUUID(),
    name,
    progression: [],
    tab: TAB_TEMPLATE,
  }
}

function createInitialSong(): Song {
  return {
    id: crypto.randomUUID(),
    title: "Untitled Song",
    key: "C",
    scale: "major",
    tempo: 120,
    capoFret: 0,
    sections: [createSection("Verse"), createSection("Chorus")],
  }
}

export default function ChordProgressionBuilder() {
  const [initial] = useState(createInitialSong)
  const [song, setSong] = useState<Song>(initial)
  const [activeSectionId, setActiveSectionId] = useState<string>(initial.sections[0].id)

  const updateSong = useCallback((updater: (prev: Song) => Song) => {
    setSong((prev) => updater(prev))
  }, [])

  function setKey(key: string) {
    updateSong((s) => ({ ...s, key }))
  }

  function setScale(scale: "major" | "minor") {
    updateSong((s) => ({ ...s, scale }))
  }

  function addSection() {
    const section = createSection(`Section ${song.sections.length + 1}`)
    updateSong((s) => ({
      ...s,
      sections: [...s.sections, section],
    }))
    setActiveSectionId(section.id)
  }

  function updateSection(sectionId: string, updater: (s: Section) => Section) {
    updateSong((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => (sec.id === sectionId ? updater(sec) : sec)),
    }))
  }

  function removeSection(sectionId: string) {
    if (song.sections.length <= 1) return
    const idx = song.sections.findIndex((s) => s.id === sectionId)
    updateSong((prev) => ({
      ...prev,
      sections: prev.sections.filter((sec) => sec.id !== sectionId),
    }))
    const remaining = song.sections.filter((s) => s.id !== sectionId)
    const nextIdx = Math.min(idx, remaining.length - 1)
    setActiveSectionId(remaining[nextIdx]?.id ?? "")
  }

  function addChordToActiveSection(chord: DiatonicChord) {
    if (!activeSectionId) return
    const slot: ProgressionSlot = {
      chord: { root: chord.root, quality: chord.quality },
      beats: 4,
    }
    updateSection(activeSectionId, (sec) => ({
      ...sec,
      progression: [...sec.progression, slot],
    }))
  }

  function removeChordFromSection(sectionId: string, index: number) {
    updateSection(sectionId, (sec) => ({
      ...sec,
      progression: sec.progression.filter((_, i) => i !== index),
    }))
  }

  function transposeSong(semitones: number) {
    updateSong((prev) => ({
      ...prev,
      key: transposeNote(prev.key, semitones),
      sections: prev.sections.map((sec) => ({
        ...sec,
        progression: sec.progression.map((slot) => ({
          ...slot,
          chord: transposeChord(slot.chord, semitones),
        })),
      })),
    }))
  }

  function setCapo(fret: number) {
    updateSong((s) => ({ ...s, capoFret: fret }))
  }

  const activeSection = song.sections.find((s) => s.id === activeSectionId)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Title & Key */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          type="text"
          value={song.title}
          onChange={(e) => updateSong((s) => ({ ...s, title: e.target.value }))}
          className="h-auto border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Song title"
        />
        <KeySelector
          key_={song.key}
          scale={song.scale}
          onKeyChange={setKey}
          onScaleChange={setScale}
        />
      </div>

      {/* Tempo & Capo */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">BPM</span>
          <Input
            type="number"
            min={20}
            max={300}
            value={song.tempo}
            onChange={(e) => updateSong((s) => ({ ...s, tempo: Number(e.target.value) }))}
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Capo</span>
          <Select
            value={String(song.capoFret)}
            onValueChange={(v) => setCapo(Number(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 13 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i === 0 ? "Off" : `Fret ${i}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transpose Controls */}
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
        <span className="text-sm text-muted-foreground">Transpose</span>
        <Button variant="outline" size="sm" onClick={() => transposeSong(-2)}>
          -2
        </Button>
        <Button variant="outline" size="sm" onClick={() => transposeSong(-1)}>
          -1
        </Button>
        <Button variant="outline" size="sm" onClick={() => transposeSong(1)}>
          +1
        </Button>
        <Button variant="outline" size="sm" onClick={() => transposeSong(2)}>
          +2
        </Button>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {song.sections.map((section) => (
          <div
            key={section.id}
            onClick={() => setActiveSectionId(section.id)}
            className={`cursor-pointer rounded-xl transition-all ${
              activeSectionId === section.id ? "ring-2 ring-primary/30" : ""
            }`}
          >
            <SectionBlock
              section={section}
              capoFret={song.capoFret}
              onUpdateName={(name) => updateSection(section.id, (s) => ({ ...s, name }))}
              onRemoveChord={(index) => removeChordFromSection(section.id, index)}
              onFocusSection={() => setActiveSectionId(section.id)}
              onRemoveSection={() => removeSection(section.id)}
              onTabChange={(tab) => updateSection(section.id, (s) => ({ ...s, tab }))}
            />
          </div>
        ))}

        <Button variant="outline" onClick={addSection} className="w-full border-dashed py-6">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add section
        </Button>
      </div>

      {/* Chord Palette */}
      {activeSection && (
        <ChordPalette
          root={song.key}
          scale={song.scale}
          onAddChord={addChordToActiveSection}
        />
      )}
    </div>
  )
}
