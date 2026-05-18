import { type CSSProperties, useState } from 'react'

const LAUNCH_EMOJI = '💜'

type Launch = {
  id: string
  sway: number
  start: number
}

function App() {
  const [launches, setLaunches] = useState<Launch[]>([])

  function launchEmoji() {
    const id = crypto.randomUUID()
    const sway = Math.round(Math.random() * 18 + 28)
    const start = Math.round(Math.random() * 44 - 22)

    setLaunches((currentLaunches) => [
      ...currentLaunches,
      { id, start, sway },
    ])
    window.setTimeout(() => {
      setLaunches((currentLaunches) =>
        currentLaunches.filter((launch) => launch.id !== id),
      )
    }, 3000)
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-end px-5 pb-10">
        <div className="launch-field" aria-hidden="true">
          {launches.map((launch) => (
            <span
              className="launched-emoji"
              key={launch.id}
              style={
                {
                  '--sway': `${launch.sway}px`,
                  '--start': `${launch.start}px`,
                } as CSSProperties
              }
            >
              <span className="launched-emoji-glyph">{LAUNCH_EMOJI}</span>
            </span>
          ))}
        </div>

        <button
          className="z-10 w-full rounded-full bg-slate-950 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-900/20 transition active:scale-[0.98]"
          type="button"
          onClick={launchEmoji}
        >
          Launch Emoji
        </button>
      </section>
    </main>
  )
}

export default App
