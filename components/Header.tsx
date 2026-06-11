"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ScaleExplorer from "./ScaleExplorer"

export default function Header() {
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
        <Button variant="ghost" size="sm" onClick={() => setShowScales(true)} className="gap-2 rounded-lg">
          <span className="inline-block size-2 rounded-full bg-primary" />
          Scales
        </Button>
      </header>
      <ScaleExplorer open={showScales} onOpenChange={setShowScales} />
    </>
  )
}
