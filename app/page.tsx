import Header from "@/components/Header"
import ChordProgressionBuilder from "@/components/ChordProgressionBuilder"

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header />
      <main className="flex-1 px-4 py-8">
        <ChordProgressionBuilder />
      </main>
    </div>
  )
}
