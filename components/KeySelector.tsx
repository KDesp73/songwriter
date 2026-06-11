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
    <div className="flex gap-4">
      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Key</label>
        <Select value={key_} onValueChange={(v) => v && onKeyChange(v)}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTES.map((note) => (
              <SelectItem key={note} value={note}>{note}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Scale</label>
        <Select value={scale} onValueChange={(v) => onScaleChange(v as "major" | "minor")}>
          <SelectTrigger className="h-9 w-full">
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
