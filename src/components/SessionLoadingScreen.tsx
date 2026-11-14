import Logo from './Logo'

export default function SessionLoadingScreen() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f3f5fc] px-6"
      aria-busy="true"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <Logo size={48} className="rounded-2xl shadow-sm" />
          <span className="text-xl font-bold tracking-tight text-[#0B184C]">ITrack</span>
        </div>
        <p role="status" aria-live="polite" className="mt-8 text-sm font-medium text-slate-700">
          Checking your session…
        </p>
        <div
          className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-200"
          aria-hidden="true"
        >
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[#3155ff]" />
        </div>
        <p className="mt-2 text-xs text-slate-500">Preparing your workspace</p>
      </div>
    </main>
  )
}
