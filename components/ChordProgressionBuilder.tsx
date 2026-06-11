"use client"

import { useState, useCallback } from "react"
import { type Song, type Section, type ProgressionSlot, TAB_TEMPLATE } from "@/lib/types"
import { transposeChord, transposeNote } from "@/lib/chords"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Header from "./Header"
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

  function addChordToActiveSection(chord: { root: string; quality: string }) {
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
    <div className="flex h-dvh flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar">
          <div className="flex flex-col gap-5 p-5">
            {/* Song Title */}
            <Input
              type="text"
              value={song.title}
              onChange={(e) => updateSong((s) => ({ ...s, title: e.target.value }))}
              className="h-auto border-none bg-transparent p-0 text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0"
              placeholder="Song title"
            />

            {/* Key & Scale */}
            <KeySelector
              key_={song.key}
              scale={song.scale}
              onKeyChange={setKey}
              onScaleChange={setScale}
            />

            {/* BPM & Capo */}
            <div className="flex gap-4">
              <div className="flex flex-1 items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">BPM</label>
                <Input
                  type="number"
                  min={20}
                  max={300}
                  value={song.tempo}
                  onChange={(e) => updateSong((s) => ({ ...s, tempo: Number(e.target.value) }))}
                  className="h-9 flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">Capo</label>
                <Select
                  value={String(song.capoFret)}
                  onValueChange={(v) => setCapo(Number(v))}
                >
                  <SelectTrigger className="h-9 w-22">
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

            {/* Transpose */}
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Transpose</label>
              <div className="flex gap-1.5">
                {[-2, -1, 1, 2].map((semis) => (
                  <Button
                    key={semis}
                    variant="secondary"
                    size="sm"
                    onClick={() => transposeSong(semis)}
                    className="h-8 flex-1 text-sm"
                  >
                    {semis > 0 ? `+${semis}` : semis}
                  </Button>
                ))}
              </div>
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
        </aside>

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-background p-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {song.sections.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`cursor-pointer rounded-xl transition-all ${
                  activeSectionId === section.id
                    ? "ring-1 ring-primary/40"
                    : "opacity-70 hover:opacity-90"
                }`}
              >
                <SectionBlock
                  section={section}
                  capoFret={song.capoFret}
                  bpm={song.tempo}
                  onUpdateName={(name) => updateSection(section.id, (s) => ({ ...s, name }))}
                  onRemoveChord={(index) => removeChordFromSection(section.id, index)}
                  onFocusSection={() => setActiveSectionId(section.id)}
                  onRemoveSection={() => removeSection(section.id)}
                  onTabChange={(tab) => updateSection(section.id, (s) => ({ ...s, tab }))}
                />
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addSection}
              className="border-2 border-dashed py-6 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2">
                <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add section
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
