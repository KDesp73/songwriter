import { type ProgressionSlot } from "@/lib/types"
import { getChordNotes, type QualityKey } from "@/lib/chords"

const BASE_MIDI = 48

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private stopped = false

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }
    return this.ctx
  }

  private playChordNotes(intervals: number[], startTime: number, duration: number) {
    const ctx = this.getCtx()

    intervals.forEach((interval) => {
      const midiNote = BASE_MIDI + interval + 12
      const freq = midiToFrequency(midiNote)

      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = "triangle"
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

  async playProgression(
    progression: ProgressionSlot[],
    bpm: number,
    onChordChange?: (index: number | null) => void,
  ): Promise<void> {
    this.stopped = false
    const ctx = this.getCtx()
    const beatMs = 60 / bpm
    let t = ctx.currentTime + 0.15

    onChordChange?.(null)

    for (let i = 0; i < progression.length; i++) {
      if (this.stopped) break

      const slot = progression[i]
      const duration = slot.beats * beatMs
      const intervals = getChordNotes(slot.chord.root, slot.chord.quality as QualityKey)

      this.playChordNotes(intervals, t, duration)

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
