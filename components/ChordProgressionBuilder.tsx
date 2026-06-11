"use client"

import { useState, useRef } from "react"
import { type Section, type ProgressionSlot } from "@/lib/types"
import { transposeChord, transposeNote, getRelativeKey, getModalInterchangeChords, chordBadgeColor, formatChord } from "@/lib/chords"
import { findShape } from "@/lib/chordShapes"
import { loadSong, exportCollection, importCollection } from "@/lib/storage"
import { downloadMidi } from "@/lib/midi"
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
    lyrics: "",
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
  const [dragSectionIndex, setDragSectionIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  function reorderSection(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    updateSong((prev) => {
      const sections = [...prev.sections]
      const [moved] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, moved)
      return { ...prev, sections }
    })
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

  function addChordToSection(sectionId: string, chord: { root: string; quality: string }) {
    const slot: ProgressionSlot = {
      chord: { root: chord.root, quality: chord.quality },
      beats: song.timeSignature.beats,
    }
    updateSection(sectionId, (sec) => ({
      ...sec,
      progression: [...sec.progression, slot],
    }))
  }

  function insertChordAfterSection(sectionId: string, index: number, chord: { root: string; quality: string }) {
    const slot: ProgressionSlot = {
      chord: { root: chord.root, quality: chord.quality },
      beats: song.timeSignature.beats,
    }
    updateSection(sectionId, (sec) => ({
      ...sec,
      progression: [...sec.progression.slice(0, index + 1), slot, ...sec.progression.slice(index + 1)],
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
    wrap(`Key: ${song.key} ${song.scale}  |  ${song.timeSignature.beats}/${song.timeSignature.noteValue}  |  BPM: ${song.tempo}${song.capoFret > 0 ? `  |  Capo: Fret ${song.capoFret}` : ""}`, 10)
    y += 4

    for (const section of song.sections) {
      if (section.progression.length === 0) continue
      if (y > 270) { doc.addPage(); y = 20 }
      wrap(section.name, 14, "bold")
      const chords = section.progression.map(s => s.chord.quality ? `${s.chord.root}${s.chord.quality}` : s.chord.root)
      wrap(chords.join("  —  "), 12, "bold", 2)
      if (section.lyrics.trim()) {
        section.lyrics.split("\n").filter(l => l.trim()).forEach(line => {
          if (y > 270) { doc.addPage(); y = 20 }
          wrap(line, 10, "normal", 2)
        })
      }
      y += 3
    }

    // Chord diagrams
    const chordNames = new Set<string>()
    for (const section of song.sections) {
      for (const slot of section.progression) {
        chordNames.add(slot.chord.quality ? `${slot.chord.root}${slot.chord.quality}` : slot.chord.root)
      }
    }
    const shapes = [...chordNames].map((name) => {
      const m = name.match(/^([A-G][b#]?)(.*)$/)
      if (!m) return undefined
      return findShape(m[1], m[2])
    }).filter((s): s is NonNullable<typeof s> => s !== undefined)

    if (shapes.length > 0) {
      doc.addPage()
      let curY = 20
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("Chord Diagrams", 10, curY)
      curY += 10

      const cols = 5
      const cellW = 38
      const cellH = 52
      const sp = 6.5
      const fp = 8
      let curCol = 0

      function drawDiagram(shape: typeof shapes[0]) {
        const cx = 10 + curCol * cellW + cellW / 2
        const top = curY

        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text(shape.name, cx, top + 2, { align: "center" })

        const sx = cx - sp * 2.5
        const sy = top + 5
        const startFret = Math.min(...shape.frets.filter((f): f is number => f !== "x" && f > 0), 1)

        for (let i = 0; i < 6; i++) {
          const x = sx + i * sp
          doc.setDrawColor(120)
          doc.setLineWidth(0.15)
          doc.line(x, sy, x, sy + 5 * fp)
        }

        for (let i = 0; i <= 5; i++) {
          const yf = sy + i * fp
          doc.setDrawColor(80)
          doc.setLineWidth(i === 0 && startFret === 1 ? 0.6 : 0.15)
          doc.line(sx, yf, sx + 5 * sp, yf)
        }

        for (let i = 0; i < shape.frets.length; i++) {
          const x = sx + i * sp
          const fret = shape.frets[i]
          if (fret === "x") {
            doc.setDrawColor(80)
            doc.setLineWidth(0.3)
            doc.line(x - 1.2, sy - 3, x + 1.2, sy - 0.6)
            doc.line(x + 1.2, sy - 3, x - 1.2, sy - 0.6)
          } else if (fret === 0) {
            doc.setDrawColor(80)
            doc.circle(x, sy - 2, 1.5, "S")
          } else {
            const yy = sy + (fret - startFret) * fp + fp / 2
            doc.setFillColor(100, 70, 190)
            doc.circle(x, yy, 2.5, "F")
            const finger = shape.fingers?.[i]
            if (finger) {
              doc.setFontSize(4)
              doc.setTextColor(255)
              doc.setFont("helvetica", "bold")
              doc.text(String(finger), x, yy + 0.5, { align: "center" })
            }
          }
        }
        doc.setTextColor(0)

        curCol++
        if (curCol >= cols) {
          curCol = 0
          curY += cellH
        }
      }

      for (const shape of shapes) {
        if (curCol === 0 && curY + cellH > 275) {
          doc.addPage()
          curY = 20
          doc.setFont("helvetica", "bold")
          doc.setFontSize(14)
          doc.text("Chord Diagrams (cont.)", 10, curY)
          curY += 10
        }
        drawDiagram(shape)
      }
    }

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text("Generated by Songwriter", 10, y = 285)

    doc.save(`${song.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
  }

  function handleExportMidi() {
    downloadMidi(song)
  }

  function handleExportCollection() {
    const json = exportCollection()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "songwriter_collection.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportCollection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importCollection(reader.result as string)
      if (result.errors.length > 0) {
        alert(`Imported ${result.imported} song(s).\nErrors:\n${result.errors.join("\n")}`)
      } else {
        alert(`Successfully imported ${result.imported} song(s).`)
      }
      switchToSong(song.id)
    }
    reader.readAsText(file)
    e.target.value = ""
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
      <Header metronome={metronome} onMetronomeChange={setMetronome} waveform={song.waveform} onWaveformChange={(w) => updateSong((s) => ({ ...s, waveform: w }))} onExport={handleExport} onExportMidi={handleExportMidi} sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* Sidebar */}
        <aside className={`flex w-80 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar transition-transform md:relative md:flex ${
          sidebarOpen
            ? "fixed inset-y-0 left-0 z-40 mt-12 flex"
            : "hidden md:flex"
        }`}>
          <div className="flex min-h-full flex-col gap-5 p-5 pt-3 md:pt-5">
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

            {/* Relative key & modal interchange */}
            {(() => {
              const relative = getRelativeKey(song.key, song.scale)
              const borrowed = song.scale === "major" ? getModalInterchangeChords(song.key, song.scale) : []
              return (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Relative {song.scale === "major" ? "Minor" : "Major"}
                  </p>
                  <p className="text-sm font-semibold">
                    {relative.root} {relative.scale === "major" ? "Major" : "Minor"}
                  </p>
                  {borrowed.length > 0 && (
                    <>
                      <p className="mb-1.5 mt-2.5 text-xs font-medium text-muted-foreground">
                        Borrowed (Parallel Minor)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {borrowed.map((c, i) => (
                          <span
                            key={i}
                            className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${chordBadgeColor(c.quality)}`}
                          >
                            {formatChord(c.root, c.quality)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* BPM & Capo */}
            <div className="space-y-2">
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
                  <SelectTrigger className="h-9 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent sideOffset={4} align="start" className="max-h-60">
                    {Array.from({ length: 13 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {i === 0 ? "Off" : `Fret ${i}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">Time</label>
                <Select
                  value={`${song.timeSignature.beats}/${song.timeSignature.noteValue}`}
                  onValueChange={(v) => {
                    if (!v) return
                    const [beats, noteValue] = v.split("/").map(Number)
                    updateSong((s) => ({ ...s, timeSignature: { beats, noteValue } }))
                  }}
                >
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent sideOffset={4} align="start">
                    {["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"].map((ts) => (
                      <SelectItem key={ts} value={ts}>
                        {ts}
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

            {/* Import / Export */}
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={handleExportCollection} className="h-8 text-xs">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-1.5">
                  <path d="M6.5 2V9M6.5 9L4 6.5M6.5 9L9 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 9V11C2 11.55 2.45 12 3 12H10C10.55 12 11 11.55 11 11V9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
                Export Collection
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById("import-input")?.click()} className="h-8 text-xs">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-1.5">
                  <path d="M6.5 9V2M6.5 2L4 4.5M6.5 2L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 9V11C2 11.55 2.45 12 3 12H10C10.55 12 11 11.55 11 11V9" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
                Import Collection
              </Button>
              <input
                id="import-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportCollection}
              />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-background p-3 sm:p-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:gap-4">
            {song.sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                draggable
                onDragStart={() => setDragSectionIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragSectionIndex !== null) {
                    reorderSection(dragSectionIndex, index)
                    setDragSectionIndex(null)
                  }
                }}
                onDragEnd={() => setDragSectionIndex(null)}
                className={`cursor-pointer rounded-xl transition-all ${
                  dragSectionIndex === index ? "opacity-40" : ""
                } ${
                  activeSectionId === section.id
                    ? "ring-1 ring-primary/40"
                    : "opacity-70 hover:opacity-90"
                }`}
              >
                <SectionBlock
                  section={section}
                  capoFret={song.capoFret}
                  bpm={song.tempo}
                  beatsPerMeasure={song.timeSignature.beats}
                  onUpdateName={(name) => updateSection(section.id, (s) => ({ ...s, name }))}
                  onRemoveChord={(index) => removeChordFromSection(section.id, index)}
                  onReorderChord={(from, to) => reorderChordInSection(section.id, from, to)}
                  onFocusSection={() => setActiveSectionId(section.id)}
                  onRemoveSection={() => removeSection(section.id)}
                  onTabChange={(tab) => updateSection(section.id, (s) => ({ ...s, tab }))}
                  onLyricsChange={(lyrics) => updateSection(section.id, (s) => ({ ...s, lyrics }))}
                  onAddChord={(chord) => addChordToSection(section.id, chord)}
                  onInsertChordAfter={(index, chord) => insertChordAfterSection(section.id, index, chord)}
                  canPaste={copiedSection !== null}
                  onCopySection={() => handleCopySection(section.id)}
                  onPasteSection={() => handlePasteSection(section.id)}
                  metronome={metronome}
                  waveform={song.waveform}
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
