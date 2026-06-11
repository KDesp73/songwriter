"use client"

import { useState, useRef } from "react"
import { type Section, type ProgressionSlot } from "@/lib/types"
import { transposeChord, transposeNote } from "@/lib/chords"
import { loadSong } from "@/lib/storage"
import { usePersistedSong } from "@/hooks/usePersistedSong"
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
    tab: `e|------------------------------------------------------------------|
B|------------------------------------------------------------------|
G|------------------------------------------------------------------|
D|------------------------------------------------------------------|
A|------------------------------------------------------------------|
E|------------------------------------------------------------------|`,
  }
}

export default function ChordProgressionBuilder() {
  const { song, updateSong, savedSongs, switchSong, newSong, deleteCurrentSong } = usePersistedSong()
  const [activeSectionId, setActiveSectionId] = useState<string>(song.sections[0]?.id ?? "")
  const [showSongList, setShowSongList] = useState(false)
  const [metronome, setMetronome] = useState(false)
  const tapTimes = useRef<number[]>([])

  function handleTapTempo() {
    const now = performance.now()
    tapTimes.current = [...tapTimes.current.filter((t) => now - t < 3000), now]
    if (tapTimes.current.length >= 4) {
      const intervals: number[] = []
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1])
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const bpm = Math.round(60000 / avg)
      if (bpm >= 20 && bpm <= 300) {
        updateSong((s) => ({ ...s, tempo: bpm }))
      }
    }
  }

  const activeSection = song.sections.find((s) => s.id === activeSectionId)

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

  function reorderChordInSection(sectionId: string, fromIndex: number, toIndex: number) {
    updateSection(sectionId, (sec) => {
      const p = [...sec.progression]
      const [moved] = p.splice(fromIndex, 1)
      p.splice(toIndex, 0, moved)
      return { ...sec, progression: p }
    })
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

  function switchToSong(id: string) {
    switchSong(id)
    const loaded = loadSong(id)
    setActiveSectionId(loaded?.sections[0]?.id ?? "")
  }

  function createNewSong() {
    newSong()
  }

  function setCapo(fret: number) {
    updateSong((s) => ({ ...s, capoFret: fret }))
  }

  async function handleExport() {
    const { default: jsPDF } = await import("jspdf")
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    let y = 20

    function wrap(text: string, size: number, style: "bold" | "normal" = "normal", indent = 0) {
      doc.setFont("helvetica", style)
      doc.setFontSize(size)
      doc.text(indent > 0 ? "  " + text : text, 10 + indent, y)
      y += size * 0.35
    }

    wrap(song.title, 22, "bold")
    wrap(`Key: ${song.key} ${song.scale}  |  BPM: ${song.tempo}${song.capoFret > 0 ? `  |  Capo: Fret ${song.capoFret}` : ""}`, 10)
    y += 4

    for (const section of song.sections) {
      if (section.progression.length === 0) continue
      if (y > 270) { doc.addPage(); y = 20 }
      wrap(section.name, 14, "bold")
      const chords = section.progression.map(s => s.chord.quality ? `${s.chord.root}${s.chord.quality}` : s.chord.root)
      wrap(chords.join("  —  "), 12, "bold", 2)
      y += 3
    }

    y = Math.max(y, 275)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text("Generated by Songwriter", 10, y)

    doc.save(`${song.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
  }

  const [copiedSection, setCopiedSection] = useState<Section | null>(null)

  function handleCopySection(sectionId: string) {
    const section = song.sections.find((s) => s.id === sectionId)
    if (section) setCopiedSection(structuredClone(section))
  }

  function handlePasteSection(sectionId: string) {
    if (!copiedSection) return
    const idx = song.sections.findIndex((s) => s.id === sectionId)
    const pasted: Section = {
      ...structuredClone(copiedSection),
      id: crypto.randomUUID(),
      name: copiedSection.name + " (copy)",
    }
    updateSong((prev) => {
      const sections = [...prev.sections]
      sections.splice(idx + 1, 0, pasted)
      return { ...prev, sections }
    })
    setActiveSectionId(pasted.id)
  }

  return (
    <div className="flex h-dvh flex-col">
      <Header metronome={metronome} onMetronomeChange={setMetronome} onExport={handleExport} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar">
          <div className="flex flex-col gap-5 p-5">
            {/* Song Title */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={song.title}
                onChange={(e) => updateSong((s) => ({ ...s, title: e.target.value }))}
                className="h-auto border-none bg-transparent p-0 text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0"
                placeholder="Song title"
              />
            </div>

            {/* Song actions */}
            <div className="flex gap-2">
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSongList(!showSongList)}
                  className="h-8 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                    <path d="M2 3.5H12M2 7H12M2 10.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Songs
                </Button>
                {showSongList && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSongList(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border bg-popover p-2 shadow-xl">
                      {savedSongs.length === 0 && (
                        <p className="p-3 text-sm text-muted-foreground">No saved songs</p>
                      )}
                      {savedSongs.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            switchToSong(m.id)
                            setShowSongList(false)
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                            m.id === song.id ? "bg-primary/10 font-medium text-primary" : ""
                          }`}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={createNewSong}
                className="h-8 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                  <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                New
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={deleteCurrentSong}
                className="h-8 text-sm text-destructive hover:text-destructive"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                  <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Delete
              </Button>
            </div>

            {/* Key & Scale */}
            <KeySelector
              key_={song.key}
              scale={song.scale}
              onKeyChange={setKey}
              onScaleChange={setScale}
            />

            {/* BPM & Capo */}
            <div className="flex gap-4">
              <div className="flex flex-1 items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">BPM</label>
                <Input
                  type="number"
                  min={20}
                  max={300}
                  value={song.tempo}
                  onChange={(e) => updateSong((s) => ({ ...s, tempo: Number(e.target.value) }))}
                  className="h-9 w-16"
                />
                <button
                  onClick={handleTapTempo}
                  className="flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                  title="Tap to set tempo"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M7 4V7.5L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Tap
                </button>
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
                  onReorderChord={(from, to) => reorderChordInSection(section.id, from, to)}
                  onFocusSection={() => setActiveSectionId(section.id)}
                  onRemoveSection={() => removeSection(section.id)}
                  onTabChange={(tab) => updateSection(section.id, (s) => ({ ...s, tab }))}
                  canPaste={copiedSection !== null}
                  onCopySection={() => handleCopySection(section.id)}
                  onPasteSection={() => handlePasteSection(section.id)}
                  metronome={metronome}
                  songKey={song.key}
                  songScale={song.scale}
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
