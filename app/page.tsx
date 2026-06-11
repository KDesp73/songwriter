import ChordProgressionBuilder from "@/components/ChordProgressionBuilder"

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Songwriter</h1>
          <span className="text-sm text-muted-foreground">Chord Progression Builder</span>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">
        <ChordProgressionBuilder />
      </main>
    </div>
  )
}
