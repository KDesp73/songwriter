"use client"

import { NOTES } from "@/lib/chords"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface KeySelectorProps {
  key_: string
  scale: "major" | "minor"
  onKeyChange: (key: string) => void
  onScaleChange: (scale: "major" | "minor") => void
}

export default function KeySelector({ key_, scale, onKeyChange, onScaleChange }: KeySelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Key</span>
        <Select value={key_} onValueChange={(v) => v && onKeyChange(v)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTES.map((note) => (
              <SelectItem key={note} value={note}>
                {note}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Scale</span>
        <Select value={scale} onValueChange={(v) => onScaleChange(v as "major" | "minor")}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
