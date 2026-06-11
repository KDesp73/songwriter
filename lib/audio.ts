import { type ProgressionSlot, type WaveformType } from "@/lib/types"
import { getChordNotes, type QualityKey } from "@/lib/chords"

const BASE_MIDI = 48

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private stopped = false

  private static instance: AudioEngine | null = null

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine()
    }
    return AudioEngine.instance
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }
    return this.ctx
  }

  private playChordNotes(intervals: number[], startTime: number, duration: number, waveform: WaveformType = "triangle") {
    const ctx = this.getCtx()

    intervals.forEach((interval) => {
      const midiNote = BASE_MIDI + interval + 12
      const freq = midiToFrequency(midiNote)

      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = waveform
      osc.frequency.value = freq

      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02)
      gainNode.gain.setValueAtTime(0.15, startTime + duration - 0.05)
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration + 0.01)
    })
  }

  private scheduleClick(time: number, accent: boolean) {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.value = accent ? 1200 : 800

    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(accent ? 0.25 : 0.15, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.04)
  }

  async playProgression(
    progression: ProgressionSlot[],
    bpm: number,
    onChordChange?: (index: number | null) => void,
    metronome = false,
    waveform: WaveformType = "triangle",
    beatsPerMeasure = 4,
  ): Promise<void> {
    this.stop()
    this.stopped = false
    const ctx = this.getCtx()
    const beatMs = 60 / bpm
    let t = ctx.currentTime + 0.15
    let beatCount = 0

    onChordChange?.(null)

    for (let i = 0; i < progression.length; i++) {
      if (this.stopped) break

      const slot = progression[i]
      const duration = slot.beats * beatMs
      const intervals = getChordNotes(slot.chord.root, slot.chord.quality as QualityKey)

      this.playChordNotes(intervals, t, duration, waveform)

      if (metronome) {
        for (let b = 0; b < slot.beats; b++) {
          const isDownbeat = beatCount % beatsPerMeasure === 0
          this.scheduleClick(t + b * beatMs, isDownbeat)
          beatCount++
        }
      } else {
        beatCount += slot.beats
      }

      onChordChange?.(i)
      await sleep(duration * 1000)
      t += duration
    }

    if (!this.stopped) {
      onChordChange?.(null)
    }
  }

  stop() {
    this.stopped = true
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
