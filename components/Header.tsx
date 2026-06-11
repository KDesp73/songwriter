"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ScaleExplorer from "./ScaleExplorer"

export default function Header() {
  const [showScales, setShowScales] = useState(false)

  return (
    <>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Songwriter</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowScales(true)}>
              Scales
            </Button>
            <span className="text-sm text-muted-foreground">Chord Progression Builder</span>
          </div>
        </div>
      </header>
      <ScaleExplorer open={showScales} onOpenChange={setShowScales} />
    </>
  )
}
